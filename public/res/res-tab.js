const { useState, useEffect } = React;

// 主响应面板组件
function ResponsePanel() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('empty'); // 'empty' | 'loading' | 'error' | 'success'
  const [errorInfo, setErrorInfo] = useState(null);

  // Whistle集成
  useEffect(() => {
    const wb = window.whistleBridge;
    if (!wb) return;

    const handleSessionActive = (item) => {
      if (!item) {
        setStatus('empty');
        setData(null);
        setErrorInfo(null);
        return;
      }
      setStatus('loading');
    };

    const handleSessionComplete = (item) => {
      if (!item) {
        setStatus('empty');
        setData(null);
        setErrorInfo(null);
        return;
      }

      const base64 = item.res.base64;
      if (!base64) {
        setStatus('empty');
        setData(null);
        setErrorInfo(null);
        return;
      }

      try {
        const result = window.ResHelpers.parseResponse(base64);
        setData(result);
        setStatus('success');
        setErrorInfo(null);
      } catch (error) {
        console.error('Parse error:', error);
        setStatus('error');
        setData(null);
        
        // 尝试获取原始数据用于错误显示
        try {
          const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const decodedText = new TextDecoder("utf-8").decode(bytes);
          const rawData = JSON.parse(decodedText);
          setErrorInfo(rawData);
        } catch (e) {
          setErrorInfo({ error: '无法解析原始数据' });
        }
      }
    };

    wb.addSessionActiveListener(handleSessionActive);
    wb.addSessionCompleteListener(handleSessionComplete);

    return () => {
      // cleanup if needed
    };
  }, []);

  // 获取组件
  const { 
    ResUsageStats, 
    ResContentDisplay, 
    ResToolCallsList, 
    ResMetadataDisplay, 
    ResErrorDisplay 
  } = window.ResComponents;

  if (status === 'empty') {
    return (
      <div className="res-container">
        <div className="res-empty">请选择抓包数据</div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="res-container">
        <div className="res-loading">解析响应中...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="res-container">
        <div className="res-error-state">解析失败</div>
        {errorInfo && <ResErrorDisplay rawData={errorInfo} />}
      </div>
    );
  }

  // 成功状态
  const hasContent = window.ContentHelpers.hasContent(data.content);
  const hasToolCalls = data.toolCalls && data.toolCalls.length > 0;
  const hasUsage = data.metadata && data.metadata.usage;

  return (
    <div className="res-container">
      {/* 显示使用统计 */}
      {hasUsage && <ResUsageStats usage={data.metadata.usage} />}
      
      {/* 显示内容或工具调用 */}
      {hasContent && <ResContentDisplay content={data.content} />}
      {hasToolCalls && <ResToolCallsList toolCalls={data.toolCalls} />}
      
      {/* 如果既没有内容也没有工具调用，显示错误 */}
      {!hasContent && !hasToolCalls && (
        <ResErrorDisplay rawData={errorInfo || { error: '未提取到内容' }} />
      )}
      
      {/* 显示元数据 */}
      {data.metadata && <ResMetadataDisplay metadata={data.metadata} />}
    </div>
  );
}

// 渲染应用
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<ResponsePanel />);
