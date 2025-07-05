// 响应解析工具函数

// 检测响应格式
function detectResponseType(decodedText) {
  const trimmed = decodedText.trim();
  
  // 检查是否是SSE格式
  if (trimmed.includes('data:')) {
    return 'sse';
  }
  
  // 尝试解析为JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      return 'json';
    }
  } catch (e) {
    // 不是有效JSON
  }
  
  return 'unknown';
}

// 解析LLM JSON响应
function parseLLMJson(base64Data) {
  try {
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const decodedText = new TextDecoder("utf-8").decode(bytes);
    const jsonData = JSON.parse(decodedText);
    
    let content = '';
    let toolCalls = [];
    
    // 提取content
    if (jsonData.choices && jsonData.choices[0] && jsonData.choices[0].message) {
      const message = jsonData.choices[0].message;
      
      if (message.content) {
        // 保持原始格式，不在这里转换
        // 内容格式的处理交给 ContentHelpers 工具
        content = message.content;
      }
      
      // 提取tool_calls
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        toolCalls = message.tool_calls.map(tc => ({
          id: tc.id || '',
          name: tc.function?.name || '',
          type: tc.type || 'function',
          arguments: tc.function?.arguments ? 
            (typeof tc.function.arguments === 'string' ? 
              JSON.parse(tc.function.arguments) : tc.function.arguments) : {}
        }));
      }
    } else {
      throw new Error('无效的消息格式');
    }
    
    return {
      content,
      toolCalls,
      metadata: jsonData.usage ? jsonData : null,
      type: 'json'
    };
  } catch (error) {
    console.error('Error parsing LLM JSON:', error);
    throw error;
  }
}

// 解析SSE响应（支持tool_calls）
function parseSSE(base64Data) {
  try {
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const decodedText = new TextDecoder("utf-8").decode(bytes);
    const lines = decodedText.trim().split('\n');
    
    let content = '';
    let lastMetadata = null;
    const toolCallsMap = new Map(); // 用于累积tool_calls
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('data:')) {
        const dataContent = line.slice(5).trim();
        if (dataContent === '[DONE]') {
          continue;
        }
        
        try {
          const jsonData = JSON.parse(dataContent);
          const delta = jsonData.choices?.[0]?.delta;
          
          if (delta) {
            // 提取文本内容
            if (delta.content) {
              content += delta.content;
            }
            
            // 处理tool_calls
            if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
              delta.tool_calls.forEach(tc => {
                const index = tc.index || 0;
                
                if (!toolCallsMap.has(index)) {
                  toolCallsMap.set(index, {
                    id: '',
                    name: '',
                    type: 'function',
                    arguments: ''
                  });
                }
                
                const existing = toolCallsMap.get(index);
                
                // 累积基本信息
                if (tc.id) existing.id = tc.id;
                if (tc.type) existing.type = tc.type;
                if (tc.function?.name) existing.name = tc.function.name;
                
                // 累积arguments字符串
                if (tc.function?.arguments) {
                  existing.arguments += tc.function.arguments;
                }
              });
            }
          }
          
          // 保存包含usage信息的最后一个metadata
          if (jsonData.usage) {
            lastMetadata = jsonData;
          } else if (jsonData.x_groq && jsonData.x_groq.usage) {
            // fix for x_groq usage
            jsonData.usage = jsonData.x_groq.usage;
            lastMetadata = jsonData;
          }
        } catch (error) {
          console.error('Error parsing JSON line:', error);
        }
      }
    }
    
    // 转换toolCallsMap为数组并解析arguments
    const toolCalls = [];
    for (const [index, tc] of toolCallsMap.entries()) {
      try {
        const parsedArgs = tc.arguments ? JSON.parse(tc.arguments) : {};
        toolCalls.push({
          id: tc.id,
          name: tc.name,
          type: tc.type,
          arguments: parsedArgs
        });
      } catch (e) {
        // 如果解析失败，保留原始字符串
        toolCalls.push({
          id: tc.id,
          name: tc.name,
          type: tc.type,
          arguments: tc.arguments
        });
      }
    }
    
    return {
      content,
      toolCalls,
      metadata: lastMetadata,
      type: 'sse'
    };
  } catch (error) {
    console.error('Error parsing SSE:', error);
    throw error;
  }
}

// 统一解析响应
function parseResponse(base64Data) {
  try {
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const decodedText = new TextDecoder("utf-8").decode(bytes);
    const responseType = detectResponseType(decodedText);
    
    switch (responseType) {
      case 'sse':
        return parseSSE(base64Data);
      case 'json':
        return parseLLMJson(base64Data);
      default:
        throw new Error('Unknown response format');
    }
  } catch (error) {
    console.error('Error parsing response:', error);
    throw error;
  }
}

// 导出到全局
window.ResHelpers = {
  parseResponse,
  parseSSE,
  parseLLMJson,
  detectResponseType
};
