const { useState, useEffect } = React;

// 主面板组件
function AIRequestPanel() {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('ai-req-view-mode') || 'single';
  });
  const [data, setData] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(0);
  const [status, setStatus] = useState('empty'); // 'empty' | 'loading' | 'error' | 'success'
  const [errorInfo, setErrorInfo] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolsPanelCollapsed, setToolsPanelCollapsed] = useState(() => {
    return localStorage.getItem('ai-req-tools-collapsed') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // 保存视图模式到localStorage
  useEffect(() => {
    localStorage.setItem('ai-req-view-mode', viewMode);
  }, [viewMode]);

  // 保存tools面板状态到localStorage
  useEffect(() => {
    localStorage.setItem('ai-req-tools-collapsed', toolsPanelCollapsed.toString());
  }, [toolsPanelCollapsed]);

  // 切换卡片展开状态
  const handleToggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 处理工具选择
  const handleToolSelect = (toolName) => {
    setSelectedTool(selectedTool === toolName ? null : toolName);
  };

  // 处理搜索查询变化
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // 切换tools面板
  const handleToggleToolsPanel = () => {
    setToolsPanelCollapsed(!toolsPanelCollapsed);
  };

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

    const handleSessionRequest = (item) => {
      if (!item) return;

      console.log('Session request received:', item);
      
      const base64 = item.req.base64;
      if (!base64) {
        setStatus('empty');
        setData(null);
        setErrorInfo(null);
        return;
      }
      
      try {
        const parsedData = window.HelperUtils.parseRequestData(base64);

        // 追加 originalIndex到每个消息
        parsedData.messages = parsedData.messages.map((msg, index) => ({
          ...msg,
          originalIndex: index
        }));

        setData(parsedData);
        setStatus('success');
        setErrorInfo(null);
        
        // 重置状态
        setExpandedCards({});
        setSelectedMessage(0);
        setSelectedTool(null);
        setSearchQuery('');
      } catch (error) {
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
    wb.addSessionRequestListener(handleSessionRequest);

    return () => {
      // cleanup if needed
    };
  }, []);

  // 获取组件
  const { MetadataSection } = window.MetadataComponents;
  const { ViewModeToggle, MainContentArea } = window.ViewComponents;
  const { ReqErrorDisplay } = window.MessageComponents;

  if (status === 'empty') {
    return (
      <div className="container">
        <div className="empty">请选择一个AI请求</div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="container">
        <div className="loading">解析请求数据中...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container">
        {errorInfo && <ReqErrorDisplay rawData={errorInfo} />}
      </div>
    );
  }

  return (
    <div className="container">
      <MetadataSection data={data} />
      <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      
      <MainContentArea
        data={data}
        viewMode={viewMode}
        expandedCards={expandedCards}
        selectedMessage={selectedMessage}
        onToggleCard={handleToggleCard}
        onSelectMessage={setSelectedMessage}
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        toolsPanelCollapsed={toolsPanelCollapsed}
        onToggleToolsPanel={handleToggleToolsPanel}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
}

// 渲染应用
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<AIRequestPanel />);
