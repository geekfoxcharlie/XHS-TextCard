class DownloadManager {
    constructor() {
        this.loadingElement = null;
        this.renderer = new CanvasRenderer();
    }

    setLoadingElement(element) {
        this.loadingElement = element;
    }

    showLoading() {
        this.loadingElement?.classList.add('active');
    }

    hideLoading() {
        this.loadingElement?.classList.remove('active');
    }

    async capture(layouts, config, templateId) {
        const canvas = this.renderer.render({
            layouts,
            config,
            templateId,
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
            scale: OUTPUT_WIDTH / PREVIEW_WIDTH 
        });
        
        return canvas.toDataURL('image/png');
    }

    triggerDownload(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }

    async withLoading(fn) {
        this.showLoading();
        try {
            await fn();
        } catch (err) {
            console.error('下载失败:', err);
            alert('下载失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    async download(layouts, config, templateId, index) {
        if (!layouts) return;

        await this.withLoading(async () => {
            const dataUrl = await this.capture(layouts, config, templateId);
            this.triggerDownload(dataUrl, `文字转图片-${index + 1}-${Date.now()}.png`);
        });
    }

    async downloadAll(pages, config, templateId, downloadBtn) {
        if (!pages?.length) return;

        downloadBtn && (downloadBtn.disabled = true);

        await this.withLoading(async () => {
            const zip = new JSZip();
            
            for (let i = 0; i < pages.length; i++) {
                const dataUrl = await this.capture(pages[i], config, templateId);
                zip.file(`文字转图片-${i + 1}.png`, dataUrl.split(',')[1], { base64: true });
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            this.triggerDownload(URL.createObjectURL(blob), `文字转图片-${Date.now()}.zip`);
            URL.revokeObjectURL(blob);
        });

        downloadBtn && (downloadBtn.disabled = false);
    }
}
