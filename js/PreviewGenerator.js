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

        item.innerHTML = `
            <div class="preview-item-header">
                <div class="preview-item-title">第 ${index + 1} 张 / 共 ${totalCount} 张</div>
                <div class="preview-item-actions">
                    <button class="btn-small" data-index="${index}" data-action="download">下载</button>
                </div>
            </div>
            <div class="preview-image-wrapper">
                <div class="canvas-container"></div>
            </div>`;

        const container = item.querySelector('.canvas-container');
        canvas.style.cssText = 'width: 100%; height: 100%; display: block; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);';
        container.appendChild(canvas);

        item.querySelector('[data-action="download"]').addEventListener('click', () => onDownload(index));

        return item;
    }
}
