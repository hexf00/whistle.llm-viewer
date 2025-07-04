// 视图模式切换组件
function ViewModeToggle({ viewMode, onChange }) {
  return (
    <div className="view-toggle">
      <button 
        className={viewMode === 'single' ? 'active' : ''}
        onClick={() => onChange('single')}
      >
        单栏模式
      </button>
      <button 
        className={viewMode === 'dual' ? 'active' : ''}
        onClick={() => onChange('dual')}
      >
        双栏模式
      </button>
    </div>
  );
}

// 单栏视图组件
function SingleColumnView({ messages, expandedCards, onToggleCard }) {
  const { SingleColumnCard } = window.MessageComponents;

  return (
    <div className="single-column">
      {messages.map((message, index) => (
        <SingleColumnCard
          key={message.originalIndex}
          message={message}
          index={message.originalIndex}
          isExpanded={expandedCards[message.originalIndex]}
          onToggle={onToggleCard}
        />
      ))}
    </div>
  );
}

// 双栏视图组件
function DualColumnView({ messages, selectedMessage, onSelectMessage }) {
  const { DualColumnListItem, DualColumnDetail } = window.MessageComponents;

  return (
    <div className="dual-column">
      <div className="message-list">
        {messages.map((message, index) => (
          <DualColumnListItem
            key={message.originalIndex}
            message={message}
            index={message.originalIndex}
            isSelected={selectedMessage === message}
            onSelect={onSelectMessage}
          />
        ))}
      </div>
      <div className="detail-panel">
        <DualColumnDetail 
          message={selectedMessage}
        />
      </div>
    </div>
  );
}

// 消息区域组件（包含搜索栏和消息列表）
function MessagesArea({ 
  messages, 
  viewMode, 
  expandedCards, 
  selectedMessage, 
  onToggleCard, 
  onSelectMessage,
  searchQuery,
  onSearchChange
}) {
  const { MessageSearchBar } = window.MessageComponents;
  const { filterMessages } = window.HelperUtils;
  
  const filteredMessages = filterMessages(messages, searchQuery);

  return (
    <div className="messages-area">
      <MessageSearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filteredCount={filteredMessages.length}
        totalCount={messages.length}
      />
      
      <div className="messages-content">
        {viewMode === 'single' ? (
          <SingleColumnView 
            messages={filteredMessages} 
            expandedCards={expandedCards}
            onToggleCard={onToggleCard}
          />
        ) : (
          <DualColumnView 
            messages={filteredMessages}
            selectedMessage={messages[selectedMessage]}
            onSelectMessage={onSelectMessage}
          />
        )}
      </div>
    </div>
  );
}

// 主内容区域组件（包含tools面板、工具详情面板和messages区域）
function MainContentArea({ 
  data, 
  viewMode, 
  expandedCards, 
  selectedMessage, 
  onToggleCard, 
  onSelectMessage,
  selectedTool,
  onToolSelect,
  toolsPanelCollapsed,
  onToggleToolsPanel,
  searchQuery,
  onSearchChange
}) {
  const { ToolsPanel, ToolDetailPanel } = window.ToolsComponents;

  const hasTools = data.tools && data.tools.length > 0;
  const selectedToolData = hasTools && selectedTool 
    ? data.tools.find(tool => tool.function?.name === selectedTool)
    : null;

  return (
    <div className={`main-content ${hasTools ? 'with-tools' : ''}`}>
      {hasTools && (
        <ToolsPanel
          tools={data.tools}
          messages={data.messages}
          selectedTool={selectedTool}
          onToolSelect={onToolSelect}
          isCollapsed={toolsPanelCollapsed}
          onToggleCollapse={onToggleToolsPanel}
          onSearchChange={onSearchChange}
        />
      )}
      
      <div className={`messages-area-container ${hasTools && !toolsPanelCollapsed ? 'with-sidebar' : ''}`}>
        <MessagesArea
          messages={data.messages}
          viewMode={viewMode}
          expandedCards={expandedCards}
          selectedMessage={selectedMessage}
          onToggleCard={onToggleCard}
          onSelectMessage={onSelectMessage}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        
        {selectedToolData && (
          <div className="tool-detail-overlay">
            <ToolDetailPanel 
              tool={selectedToolData}
              onClose={() => onToolSelect(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 导出组件
window.ViewComponents = {
  ViewModeToggle,
  SingleColumnView,
  DualColumnView,
  MainContentArea
};
