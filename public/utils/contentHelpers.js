// 消息内容处理工具类
// 用于处理消息内容的不同格式：字符串格式或数组格式

/**
 * 提取消息内容为纯文本
 * @param {string|Array} content - 消息内容，可能是字符串或数组格式
 * @returns {string} 纯文本内容
 */
function extractTextContent(content) {
  if (!content) return '';
  
  // 如果是字符串，直接返回
  if (typeof content === 'string') {
    return content;
  }
  
  // 如果是数组，提取所有文本类型的内容
  if (Array.isArray(content)) {
    return content
      .filter(item => item && item.type === 'text')
      .map(item => item.text || '')
      .join('');
  }
  
  return '';
}

/**
 * 检查消息是否有内容
 * @param {string|Array} content - 消息内容
 * @returns {boolean} 是否有内容
 */
function hasContent(content) {
  const textContent = extractTextContent(content);
  return textContent.trim() !== '';
}

/**
 * 获取内容长度（字符数）
 * @param {string|Array} content - 消息内容
 * @returns {number} 内容长度
 */
function getContentLength(content) {
  const textContent = extractTextContent(content);
  return textContent.length;
}

/**
 * 检查内容是否包含指定查询字符串
 * @param {string|Array} content - 消息内容
 * @param {string} query - 查询字符串
 * @returns {boolean} 是否包含查询字符串
 */
function contentIncludes(content, query) {
  const textContent = extractTextContent(content);
  return textContent.toLowerCase().includes(query.toLowerCase());
}

/**
 * 解析消息内容为结构化数据
 * @param {string|Array} content - 消息内容
 * @returns {Object} 解析后的内容信息
 */
function parseContent(content) {
  if (!content) {
    return {
      type: 'empty',
      textContent: '',
      isArray: false,
      items: []
    };
  }
  
  if (typeof content === 'string') {
    return {
      type: 'string',
      textContent: content,
      isArray: false,
      items: [{ type: 'text', text: content }]
    };
  }
  
  if (Array.isArray(content)) {
    const textContent = extractTextContent(content);
    return {
      type: 'array',
      textContent,
      isArray: true,
      items: content
    };
  }
  
  return {
    type: 'unknown',
    textContent: '',
    isArray: false,
    items: []
  };
}

/**
 * 渲染消息内容为 React 元素
 * @param {string|Array} content - 消息内容
 * @returns {React.ReactNode} 渲染的内容
 */
function renderContent(content) {
  const parsedContent = parseContent(content);
  
  if (parsedContent.type === 'empty') {
    return null;
  }
  
  if (parsedContent.type === 'string') {
    return React.createElement('span', null, parsedContent.textContent);
  }
  
  if (parsedContent.type === 'array') {
    return React.createElement(
      'div',
      { className: 'content-array' },
      parsedContent.items.map((item, index) => {
        // 处理文本类型
        if (item.type === 'text') {
          return React.createElement('span', { key: index, className: 'content-text' }, item.text);
        }
        
        // 处理图片类型
        if (item.type === 'image_url') {
          const imageUrl = item.image_url?.url || item.image_url;
          if (imageUrl) {
            return React.createElement('div', {
              key: index,
              className: 'content-image-container'
            }, [
              React.createElement('img', {
                key: 'img',
                src: imageUrl,
                alt: item.alt || 'Image content',
                className: 'content-image',
                loading: 'lazy',
                onError: (e) => {
                  // 隐藏图片，显示错误信息
                  e.target.style.display = 'none';
                  const errorDiv = e.target.nextSibling;
                  if (errorDiv && errorDiv.className === 'content-image-error') {
                    errorDiv.style.display = 'block';
                  }
                }
              }),
              React.createElement('div', {
                key: 'error',
                className: 'content-image-error',
                style: { display: 'none' }
              }, `图片加载失败: ${imageUrl.length > 50 ? imageUrl.substring(0, 50) + '...' : imageUrl}`)
            ]);
          } else {
            return React.createElement('div', {
              key: index,
              className: 'content-image-error'
            }, '图片URL无效');
          }
        }
        
        // TODO: 处理其他类型内容（音频、视频等）
        return React.createElement(
          'div',
          { key: index, className: 'content-item-placeholder' },
          `[${item.type} content - TODO: implement rendering]`
        );
      })
    );
  }
  
  return React.createElement('span', null, '[Unknown content type]');
}

// 导出工具函数
window.ContentHelpers = {
  extractTextContent,
  hasContent,
  getContentLength,
  contentIncludes,
  parseContent,
  renderContent
};
