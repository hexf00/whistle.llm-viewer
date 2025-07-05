// 计算字符数和token数
function calculateStats(content) {
  if (!content) return { chars: 0, tokens: 0 };
  
  const chars = content.length;
  
  // 简单的token估算：中文字符1.8，其他字符0.25
  let tokens = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (/[\u4e00-\u9fff]/.test(char)) { // 中文字符
      tokens += 1.8;
    } else {
      tokens += 0.25;
    }
  }
  
  return { chars, tokens: Math.round(tokens) };
}

// 计算单个消息的统计信息（包括content和tool_calls）
function calculateMessageStats(message) {
  if (!message) return { chars: 0, tokens: 0 };
  
  let totalContent = '';
  
  // 添加消息内容 - 使用新的内容处理工具
  if (window.ContentHelpers.hasContent(message.content)) {
    totalContent += window.ContentHelpers.extractTextContent(message.content);
  }
  
  // 添加工具调用内容
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolContent = message.tool_calls.map(toolCall => {
      const name = toolCall.function?.name || '';
      const args = toolCall.function?.arguments || '';
      return `${name}(${args})`;
    }).join(', ');
    
    if (totalContent) {
      totalContent += '\n' + toolContent;
    } else {
      totalContent = toolContent;
    }
  }
  
  return calculateStats(totalContent);
}

// 计算单个工具的统计信息（描述 + 参数）
function calculateToolStats(tool) {
  if (!tool || !tool.function) return { chars: 0, tokens: 0 };
  
  const description = tool.function.description || '';
  const parameters = JSON.stringify(tool.function.parameters || {}, null, 2);
  const toolContent = description + parameters;
  
  return calculateStats(toolContent);
}

// 计算总计统计信息
function calculateTotalStats(data) {
  if (!data) return { chars: 0, tokens: 0 };
  
  let totalChars = 0;
  let totalTokens = 0;
  
  // 统计所有消息
  if (data.messages && Array.isArray(data.messages)) {
    data.messages.forEach(message => {
      const stats = calculateMessageStats(message);
      totalChars += stats.chars;
      totalTokens += stats.tokens;
    });
  }
  
  // 统计所有工具
  if (data.tools && Array.isArray(data.tools)) {
    data.tools.forEach(tool => {
      const stats = calculateToolStats(tool);
      totalChars += stats.chars;
      totalTokens += stats.tokens;
    });
  }
  
  return { chars: totalChars, tokens: totalTokens };
}

// 获取字符数标签样式
function getCharBadgeClass(chars) {
  if (chars < 500) return 'char-badge char-light';
  if (chars > 2000) return 'char-badge char-dark';
  return 'char-badge char-medium';
}

// 获取token数标签样式
function getTokenBadgeClass(tokens) {
  if (tokens < 300) return 'token-badge token-light';
  if (tokens > 1200) return 'token-badge token-dark';
  return 'token-badge token-medium';
}

// 获取角色标签样式
function getRoleBadgeClass(role) {
  return `role-badge role-${role}`;
}

// 修复系统消息格式，支持顶层 system 字段
function fix_system_messages(jsonData) {
  if (!jsonData.system) {
    return jsonData;
  }
  
  // 提取顶层 system 内容
  let systemContent = '';
  if (Array.isArray(jsonData.system)) {
    const textParts = [];
    jsonData.system.forEach(item => {
      if (item && typeof item === 'object' && item.text) {
        textParts.push(item.text);
      } else if (typeof item === 'string') {
        textParts.push(item);
      }
    });
    systemContent = textParts.join('\n');
  } else if (typeof jsonData.system === 'string') {
    systemContent = jsonData.system;
  }
  
  // 如果有有效的 system 内容，添加到 messages 开头
  if (systemContent.trim()) {
    const systemMessage = {
      role: 'system',
      content: systemContent
    };
    jsonData.messages.unshift(systemMessage);
  }
  
  // 删除顶层 system 字段
  delete jsonData.system;
  
  return jsonData;
}

// 解析请求数据
function parseRequestData(base64Data) {
  try {
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const requestText = new TextDecoder("utf-8").decode(bytes);
    let jsonData = JSON.parse(requestText);
    console.log('Parsed LLM request data:', jsonData);
    
    // 修复系统消息格式
    jsonData = fix_system_messages(jsonData);
    
    if (!jsonData.messages || !Array.isArray(jsonData.messages)) {
      throw new Error('Invalid LLM request format');
    }
    
    return jsonData;
  } catch (error) {
    throw new Error('Failed to parse request data');
  }
}

// 计算工具使用次数
function calculateToolUsage(messages, toolName) {
  if (!messages || !toolName) return 0;
  
  let count = 0;
  messages.forEach(message => {
    if (message.tool_calls) {
      message.tool_calls.forEach(toolCall => {
        if (toolCall.function?.name === toolName) {
          count++;
        }
      });
    }
  });
  return count;
}

// 获取所有使用的工具名称
function getUsedToolNames(messages) {
  if (!messages) return [];
  
  const toolNames = new Set();
  messages.forEach(message => {
    if (message.tool_calls) {
      message.tool_calls.forEach(toolCall => {
        if (toolCall.function?.name) {
          toolNames.add(toolCall.function.name);
        }
      });
    }
  });
  return Array.from(toolNames);
}

// 解析搜索查询
function parseSearchQuery(query) {
  if (!query || !query.trim()) {
    return { type: 'empty' };
  }

  const trimmedQuery = query.trim();
  
  // 解析规则：role:xxx, tool:xxx, content:xxx
  const ruleMatches = {
    role: trimmedQuery.match(/role:\s*(\w+)/i),
    tool: trimmedQuery.match(/tool:\s*([^\s]+)/i),
    content: trimmedQuery.match(/content:\s*(.+)/i)
  };

  // 检查是否有任何规则匹配
  const hasRules = Object.values(ruleMatches).some(match => match !== null);

  if (hasRules) {
    return {
      type: 'structured',
      role: ruleMatches.role ? ruleMatches.role[1].toLowerCase() : null,
      tool: ruleMatches.tool ? ruleMatches.tool[1] : null,
      content: ruleMatches.content ? ruleMatches.content[1].trim() : null
    };
  }

  // 没有规则，使用模糊匹配
  return {
    type: 'fuzzy',
    query: trimmedQuery.toLowerCase()
  };
}

// 过滤消息
function filterMessages(messages, searchQuery) {
  if (!messages || !Array.isArray(messages)) {
    return messages || [];
  }

  const parsed = parseSearchQuery(searchQuery);
  
  if (parsed.type === 'empty') {
    return messages;
  }

  return messages.filter((message, index) => {
    if (parsed.type === 'structured') {
      // 结构化搜索
      let matches = true;

      // 检查角色
      if (parsed.role && message.role.toLowerCase() !== parsed.role) {
        matches = false;
      }

      // 检查工具调用
      if (parsed.tool && matches) {
        const hasMatchingTool = message.tool_calls && message.tool_calls.some(
          toolCall => toolCall.function?.name === parsed.tool
        );
        if (!hasMatchingTool) {
          matches = false;
        }
      }

      // 检查内容
      if (parsed.content && matches) {
        const contentToSearch = window.ContentHelpers.extractTextContent(message.content).toLowerCase();
        if (!contentToSearch.includes(parsed.content.toLowerCase())) {
          matches = false;
        }
      }

      return matches;
    } else {
      // 模糊匹配
      const query = parsed.query;
      
      // 搜索角色
      if (message.role.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索内容
      if (window.ContentHelpers.contentIncludes(message.content, query)) {
        return true;
      }

      // 搜索工具调用
      if (message.tool_calls) {
        const hasMatchingTool = message.tool_calls.some(toolCall => {
          const toolName = toolCall.function?.name || '';
          const toolArgs = toolCall.function?.arguments || '';
          return toolName.toLowerCase().includes(query) || 
                 toolArgs.toLowerCase().includes(query);
        });
        if (hasMatchingTool) {
          return true;
        }
      }

      return false;
    }
  });
}

// 导出所有函数
window.HelperUtils = {
  calculateStats,
  getCharBadgeClass,
  getTokenBadgeClass,
  getRoleBadgeClass,
  fix_system_messages,
  parseRequestData,
  calculateToolUsage,
  getUsedToolNames,
  parseSearchQuery,
  filterMessages,
  calculateMessageStats,
  calculateToolStats,
  calculateTotalStats
};
