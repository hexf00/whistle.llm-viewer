// 元数据展示组件
function MetadataSection({ data }) {
  if (!data) return null;
  
  const { model, temperature, stream, max_tokens, top_p } = data;
  
  // 计算总计统计信息
  const { calculateTotalStats, getCharBadgeClass, getTokenBadgeClass } = window.HelperUtils;
  const totalStats = calculateTotalStats(data);
  
  return (
    <div className="metadata">
      <div className="metadata-grid">
        {model && (
          <div className="metadata-item">
            <span className="metadata-label">Model: </span>
            {model}
          </div>
        )}
        {temperature !== undefined && (
          <div className="metadata-item">
            <span className="metadata-label">Temperature: </span>
            {temperature}
          </div>
        )}
        {stream !== undefined && (
          <div className="metadata-item">
            <span className="metadata-label">Stream: </span>
            {stream.toString()}
          </div>
        )}
        {max_tokens && (
          <div className="metadata-item">
            <span className="metadata-label">Max Tokens: </span>
            {max_tokens}
          </div>
        )}
        {top_p !== undefined && (
          <div className="metadata-item">
            <span className="metadata-label">Top P: </span>
            {top_p}
          </div>
        )}
        <div className="metadata-item">
          <span className="metadata-label">总计: </span>
          <span className={getCharBadgeClass(totalStats.chars)}>
            char:{totalStats.chars}
          </span>
          <span className={getTokenBadgeClass(totalStats.tokens)}>
            token:{totalStats.tokens}
          </span>
        </div>
      </div>
    </div>
  );
}

// 导出组件
window.MetadataComponents = {
  MetadataSection
};
