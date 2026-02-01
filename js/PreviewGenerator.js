/**
 * PreviewGenerator - 预览组件生成器
 * 
 * 设计原则：
 * 1. 实时预览：通过 CanvasRenderer 实时生成与输出图比例一致的预览图。
 * 2. 交互集成：为每张生成的卡片提供独立的下载触发器和分页显示。
 * 3. 性能平衡：预览时使用适度的 Scale (如 2.0) 以平衡画质与内存占用。
 */
class PreviewGenerator {
    constructor(templateManager) {
        this.templateManager = templateManager;
        this.renderer = new CanvasRenderer();
    }

    /**
     * 创建一个预览卡片 DOM 元素
     */
    createPreviewItem(layouts, index, totalCount, templateId, config, onDownload) {
        const item = document.createElement('div');
        item.className = 'preview-item';

        const canvas = this.renderer.render({
            layouts, config, templateId,
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
            scale: 2 
        });

        // 头部信息容器
        const header = document.createElement('div');
        header.className = 'preview-item-header';
        
        const title = document.createElement('div');
        title.className = 'preview-item-title';
        title.textContent = `第 ${index + 1} 张 / 共 ${totalCount} 张`;
        
        const actions = document.createElement('div');
        actions.className = 'preview-item-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-small';
        downloadBtn.textContent = '下载';
        downloadBtn.addEventListener('click', () => onDownload(index));
        
        actions.appendChild(downloadBtn);
        header.appendChild(title);
        header.appendChild(actions);

        // 图像包装容器
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'preview-image-wrapper';
        
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        
        canvas.className = 'preview-canvas';
        
        canvasContainer.appendChild(canvas);
        imageWrapper.appendChild(canvasContainer);
        
        item.appendChild(header);
        item.appendChild(imageWrapper);

        return item;
    }
}
