class PreviewGenerator {
    constructor(templateManager) {
        this.templateManager = templateManager;
        this.renderer = new CanvasRenderer();
    }

    createPreviewItem(layouts, index, totalCount, templateId, config, onDownload) {
        const item = document.createElement('div');
        item.className = 'preview-item';

        const canvas = this.renderer.render({
            layouts,
            config,
            templateId,
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
            scale: 2 
        });

        const html = `
<div class="preview-item-header">
    <div class="preview-item-title">第 ${index + 1} 张 / 共 ${totalCount} 张</div>
    <div class="preview-item-actions">
        <button class="btn-small" data-index="${index}" data-action="download">下载</button>
    </div>
</div>
<div class="preview-image-wrapper">
    <div class="canvas-container" style="width: ${PREVIEW_WIDTH}px; height: ${PREVIEW_HEIGHT}px;">
    </div>
</div>`;

        item.innerHTML = html;
        const container = item.querySelector('.canvas-container');
        
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        
        container.appendChild(canvas);

        const downloadBtn = item.querySelector('[data-action="download"]');
        downloadBtn.addEventListener('click', () => {
            onDownload(index);
        });

        return item;
    }
}
