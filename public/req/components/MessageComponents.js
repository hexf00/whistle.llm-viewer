// 搜索栏组件
function MessageSearchBar({ searchQuery, onSearchChange, filteredCount, totalCount }) {
  const { useState } = React;
  const [showPresets, setShowPresets] = useState(false);
  
  const presetOptions = [
    { label: '所有工具调用', value: 'tool:' },
    { label: '用户消息', value: 'role:user' },
    { label: '助手消息', value: 'role:assistant' },
    { label: '系统消息', value: 'role:system' },
    { label: '内容搜索', value: 'content:' }
  ];

  const handlePresetClick = (preset) => {
    onSearchChange(preset.value);
    setShowPresets(false);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="message-search-bar">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="搜索消息 (支持: role:user, tool:function_name, content:关键词, 或直接输入关键词)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        
        {searchQuery && (
          <button 
            className="clear-search-btn"
            onClick={handleClearSearch}
            title="清除搜索"
          >
            ✕
          </button>
        )}
        
        <div className="search-controls">
          <button
            className="presets-btn"
            onClick={() => setShowPresets(!showPresets)}
            title="预置搜索选项"
          >
            ▼
          </button>
          
          {showPresets && (
            <div className="presets-dropdown">
              {presetOptions.map((preset, index) => (
                <div
                  key={index}
                  className="preset-option"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="search-icon">🔍</div>
      </div>
      {searchQuery && (
        <div className="search-results-info">
          找到 {filteredCount} / {totalCount} 条消息
        </div>
      )}
    </div>
  );
}

// 纯粹的消息内容组件
function MessageContent({ message }) {
  const renderedContent = window.ContentHelpers.renderContent(message.content);
  return (
    <div className="message-content">
      {renderedContent}
    </div>
  );
}

// Tool调用内容组件
function ToolCallContent({ toolCalls }) {
  return (
    <div className="tool-call-content">
      {toolCalls.map((toolCall, index) => (
        <div 
          key={toolCall.id || index} 
          className="tool-call-item"
        >
          <div className="tool-call-header">
            <span className="tool-name">{toolCall.function?.name}</span>
            <span className="tool-type">{toolCall.type}</span>
          </div>
          {toolCall.function?.arguments && (
            <div className="tool-arguments">
              <pre>{JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 统一的内容渲染组件
function UnifiedContent({ message }) {
  const hasContent = window.ContentHelpers.hasContent(message.content);
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;

  return (
    <div className="unified-content">
      {hasContent && <MessageContent message={message} />}
      {hasToolCalls && <ToolCallContent toolCalls={message.tool_calls} />}
      {!hasContent && !hasToolCalls && (
        <div className="empty-content">无内容</div>
      )}
    </div>
  );
}

// 单栏模式的卡片组件
function SingleColumnCard({ message, index, isExpanded, onToggle }) {
  const { getRoleBadgeClass, calculateMessageStats, getCharBadgeClass, getTokenBadgeClass } = window.HelperUtils;

  const hasContent = window.ContentHelpers.hasContent(message.content);
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;
  const stats = calculateMessageStats(message);
  
  // 生成预览文本
  let previewText = '';
  let totalLength = 0;
  
  if (hasContent) {
    previewText = window.ContentHelpers.extractTextContent(message.content);
    totalLength += window.ContentHelpers.getContentLength(message.content);
  }
  
  if (hasToolCalls) {
    const toolText = message.tool_calls.map(tc => `${tc.function?.name}(${tc.function?.arguments || ''})`).join(', ');
    previewText = hasContent ? `${previewText}\n[Tools: ${toolText}]` : `[Tools: ${toolText}]`;
    totalLength += toolText.length;
  }
  
  const isLongContent = totalLength > 100;
  const displayPreview = isLongContent ? previewText.substring(0, 100) : previewText;
  const omittedChars = isLongContent ? totalLength - 100 : 0;

  return (
    <div className="message-card">
      <div className="card-unified">
        <div 
          className="card-header-inline"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(index);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="badge-group">
            <span className="index-badge">{index + 1}</span>
            <span className={getRoleBadgeClass(message.role)}>
              {message.role}
            </span>
            {hasToolCalls && (
              <span className="role-badge role-tool">
                tool_calls
              </span>
            )}
            {hasContent && (
              <>
                <span className={getCharBadgeClass(stats.chars)}>
                  char:{stats.chars}
                </span>
                <span className={getTokenBadgeClass(stats.tokens)}>
                  token:{stats.tokens}
                </span>
              </>
            )}
          </div>
          <div className="card-meta">
            {!isExpanded && omittedChars > 0 && (
              <span className="omitted-text">省略了 {omittedChars} 字符</span>
            )}
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
              ▶
            </span>
          </div>
        </div>
        <div className={`message-display ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {isExpanded ? (
            <UnifiedContent message={message} />
          ) : (
            <div className="preview-content">
              {displayPreview}
              {omittedChars > 0 && '...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 双栏模式的列表项组件
function DualColumnListItem({ message, index, isSelected, onSelect }) {
  const { getRoleBadgeClass, calculateMessageStats, getCharBadgeClass, getTokenBadgeClass } = window.HelperUtils;

  const hasContent = window.ContentHelpers.hasContent(message.content);
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;
  const stats = calculateMessageStats(message);
  
  let previewText = '';
  if (hasContent) {
    previewText = window.ContentHelpers.extractTextContent(message.content);
  }
  if (hasToolCalls) {
    const toolText = message.tool_calls.map(tc => tc.function?.name).join(', ');
    previewText = hasContent ? `${previewText} [Tools: ${toolText}]` : `[Tools: ${toolText}]`;
  }
  
  const preview = previewText.length > 50 
    ? previewText.substring(0, 50) + '...' 
    : previewText;

  return (
    <div 
      className={`list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(index)}
    >
      <div className="list-item-header">
        <div className="badge-group">
          <span className="index-badge">{index + 1}</span>
          <span className={getRoleBadgeClass(message.role)}>
            {message.role}
          </span>
          {hasToolCalls && (
            <span className="role-badge role-tool">
              tool_calls
            </span>
          )}
          {hasContent && (
            <>
              <span className={getCharBadgeClass(stats.chars)}>
                char:{stats.chars}
              </span>
              <span className={getTokenBadgeClass(stats.tokens)}>
                token:{stats.tokens}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="list-item-preview">
        {preview.replace(/\n/g, ' ')}
      </div>
    </div>
  );
}

// 双栏模式的详情组件
function DualColumnDetail({ message }) {
  const { getRoleBadgeClass, calculateMessageStats, getCharBadgeClass, getTokenBadgeClass } = window.HelperUtils;

  if (!message) {
    return (
      <div className="detail-empty">
        请选择一条消息查看详情
      </div>
    );
  }

  const hasContent = window.ContentHelpers.hasContent(message.content);
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;
  const stats = calculateMessageStats(message);

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <div className="badge-group">
          <span className="index-badge">{message.originalIndex + 1}</span>
          <span className={getRoleBadgeClass(message.role)}>
            {message.role}
          </span>
          {hasToolCalls && (
            <span className="role-badge role-tool">
              tool_calls
            </span>
          )}
          {hasContent && (
            <>
              <span className={getCharBadgeClass(stats.chars)}>
                char:{stats.chars}
              </span>
              <span className={getTokenBadgeClass(stats.tokens)}>
                token:{stats.tokens}
              </span>
            </>
          )}
        </div>
      </div>
      <UnifiedContent message={message} />
    </div>
  );
}

// 错误显示组件
function ReqErrorDisplay({ rawData }) {
  return (
    <div className="req-error">
      <div className="error-message" style={{
        color: '#d73a49',
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        解析失败：不是有效的LLM请求格式
      </div>
      <pre style={{
        marginTop: '8px',
        background: '#f6f8fa',
        padding: '8px',
        borderRadius: '3px',
        overflowX: 'auto',
        color: '#24292e',
        fontSize: '12px',
        lineHeight: '1.4'
      }}>
        {JSON.stringify(rawData, null, 2)}
      </pre>
    </div>
  );
}

// 导出组件
window.MessageComponents = {
  MessageSearchBar,
  MessageContent,
  ToolCallContent,
  UnifiedContent,
  SingleColumnCard,
  DualColumnListItem,
  DualColumnDetail,
  ReqErrorDisplay
};
