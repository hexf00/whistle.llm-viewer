const { useState } = React;

// 工具项组件
function ToolItem({ tool, usageCount, isSelected, onSelect, onSearchChange }) {
  const { calculateToolStats, getCharBadgeClass, getTokenBadgeClass } = window.HelperUtils;
  
  // 计算工具卡片的统计信息（描述 + 参数）
  const stats = calculateToolStats(tool);
  const toolContent = (tool.function?.description || '') + 
    JSON.stringify(tool.function?.parameters || {}, null, 2);
  
  // 计算预览文本和省略信息
  const maxLength = 100; // 预览长度限制
  const previewText = toolContent.length > maxLength 
    ? toolContent.substring(0, maxLength) 
    : toolContent;
  const omittedChars = toolContent.length > maxLength 
    ? toolContent.length - maxLength 
    : 0;

  const handleClick = () => {
    onSelect(tool.function?.name);
  };

  const handleUsageCountClick = (e) => {
    e.stopPropagation();
    if (onSearchChange && tool.function?.name) {
      onSearchChange(`tool:${tool.function.name}`);
    }
  };

  return (
    <div 
      className={`tool-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="tool-card-header">
        <div className="tool-name-section">
          <span className="tool-name">{tool.function?.name || 'Unknown'}</span>
          {usageCount > 0 && (
            <span 
              className="usage-count clickable" 
              onClick={handleUsageCountClick}
              title={`点击过滤 ${tool.function?.name} 工具调用`}
            >
              {usageCount}次调用
            </span>
          )}
        </div>
        <div className="tool-stats">
          <span className={getCharBadgeClass(stats.chars)}>
            char:{stats.chars}
          </span>
          <span className={getTokenBadgeClass(stats.tokens)}>
            token:{stats.tokens}
          </span>
        </div>
      </div>
      
      <div className="tool-card-content">
        {tool.function?.description && (
          <div className="tool-description-preview">
            {tool.function.description.length > 50 
              ? tool.function.description.substring(0, 50) + '...'
              : tool.function.description
            }
          </div>
        )}
        
        {omittedChars > 0 && (
          <div className="tool-omitted-hint">
            省略了 {omittedChars} 字符，点击查看完整内容
          </div>
        )}
      </div>
    </div>
  );
}

// 工具面板组件
function ToolsPanel({ tools, selectedTool, onToolSelect, isCollapsed, onToggleCollapse, messages, onSearchChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!tools || tools.length === 0) {
    return null;
  }

  // 计算工具使用次数
  const getToolUsageCount = (toolName) => {
    return window.HelperUtils.calculateToolUsage(messages, toolName);
  };

  const filteredTools = tools.filter(tool => 
    !searchTerm || 
    tool.function?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.function?.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`tools-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="tools-header">
        <div className="tools-title">
          {!isCollapsed && <span>工具列表 ({tools.length})</span>}
          <button 
            className="collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? '展开工具面板' : '收起工具面板'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="tools-search">
            <input
              type="text"
              placeholder="搜索工具..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="tools-content">
          {filteredTools.length === 0 ? (
            <div className="tools-empty">
              {searchTerm ? '未找到匹配的工具' : '暂无工具'}
            </div>
          ) : (
            filteredTools.map((tool, index) => (
              <ToolItem
                key={tool.function?.name || index}
                tool={tool}
                isSelected={selectedTool === tool.function?.name}
                usageCount={getToolUsageCount(tool.function?.name)}
                onSelect={onToolSelect}
                onSearchChange={onSearchChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// 工具详情面板组件
function ToolDetailPanel({ tool, onClose }) {
  if (!tool) return null;

  return (
    <div className="tool-detail-panel">
      <div className="tool-detail-header">
        <h3 className="tool-detail-title">{tool.function?.name || 'Unknown Tool'}</h3>
        <button className="tool-detail-close" onClick={onClose} title="关闭详情">
          ✕
        </button>
      </div>
      
      <div className="tool-detail-content">
        {tool.function?.description && (
          <div className="tool-detail-section">
            <h4>描述</h4>
            <pre className="tool-detail-description">
              {tool.function.description}
            </pre>
          </div>
        )}
        
        {tool.function?.parameters && (
          <div className="tool-detail-section">
            <h4>参数结构</h4>
            <pre className="tool-detail-schema">
              {JSON.stringify(tool.function.parameters, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// 导出组件
window.ToolsComponents = {
  ToolItem,
  ToolsPanel,
  ToolDetailPanel
};
