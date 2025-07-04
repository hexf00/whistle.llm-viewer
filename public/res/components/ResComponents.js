// 响应内容显示组件

// 使用统计组件
function ResUsageStats({ usage }) {
  if (!usage) return null;

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
  const cost = usage.cost || 0;

  return (
    <div className="res-usage-stats">
      <div className="usage-item">输入Token: {promptTokens}</div>
      <div className="usage-item">输出Token: {completionTokens}</div>
      <div className="usage-item">缓存Token: {cachedTokens}</div>
      <div className="usage-item">Cost: ${cost.toFixed(6)}</div>
    </div>
  );
}

// 内容显示组件
function ResContentDisplay({ content }) {
  if (!content || content.trim() === '') return null;

  return (
    <div className="res-content">
      <h3>响应内容</h3>
      <div className="content-text">{content}</div>
    </div>
  );
}

// 单个工具调用组件
function ResToolCallCard({ toolCall }) {
  return (
    <div className="res-tool-call-card">
      <div className="tool-call-header">
        <span className="tool-name">{toolCall.name}</span>
        <span className="tool-id">{toolCall.id}</span>
      </div>
      <div className="tool-arguments">
        <pre>{JSON.stringify(toolCall.arguments, null, 2)}</pre>
      </div>
    </div>
  );
}

// 工具调用列表组件
function ResToolCallsList({ toolCalls }) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="res-tool-calls">
      <h3>工具调用</h3>
      <div className="tool-calls-list">
        {toolCalls.map((toolCall, index) => (
          <ResToolCallCard key={index} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}

// 元数据显示组件
function ResMetadataDisplay({ metadata }) {
  if (!metadata) return null;

  return (
    <details className="res-metadata">
      <summary>元数据</summary>
      <pre className="metadata-content">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </details>
  );
}

// 错误显示组件
function ResErrorDisplay({ rawData }) {
  return (
    <div className="res-error">
      <div className="error-message" style={{
        color: '#d73a49',
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        解析失败或未提取到内容
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
window.ResComponents = {
  ResUsageStats,
  ResContentDisplay,
  ResToolCallCard,
  ResToolCallsList,
  ResMetadataDisplay,
  ResErrorDisplay
};
