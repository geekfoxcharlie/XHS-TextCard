/**
 * DownloadManager - 图片导出与下载管理器
 * 
 * 设计原则：
 * 1. 纯净输出：无论预览状态如何，导出时必须强制关闭辅助网格。
 * 2. 离线生成：完全在客户端通过 Canvas 渲染高清图片，无需后端。
 * 3. 批量支持：集成 JSZip 实现多页卡片的一键打包下载。
 */
class DownloadManager {
    constructor() {
        this.loadingElement = null;
        this.renderer = new CanvasRenderer();
    }

    setLoadingElement(element) {
        this.loadingElement = element;
    }

    showLoading() { this.loadingElement?.classList.add('active'); }
    hideLoading() { this.loadingElement?.classList.remove('active'); }

    /**
     * 将布局渲染为高清 DataURL
     */
    async capture(layouts, config, templateId) {
        // 强制关闭辅助线
        const renderConfig = { ...config, showGrid: false };
        
        const canvas = this.renderer.render({
            layouts,
            config: renderConfig,
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
            console.error('Download failed:', err);
            alert('下载失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 下载单张图片
     */
    async download(layouts, config, templateId, index) {
        if (!layouts) return;
        await this.withLoading(async () => {
            const dataUrl = await this.capture(layouts, config, templateId);
            this.triggerDownload(dataUrl, `xhs-card-${index + 1}-${Date.now()}.png`);
        });
    }

    /**
     * 批量打包下载所有图片
     */
    async downloadAll(pages, config, templateId, downloadBtn) {
        if (!pages?.length) return;
        if (downloadBtn) downloadBtn.disabled = true;

        await this.withLoading(async () => {
            const zip = new JSZip();
            for (let i = 0; i < pages.length; i++) {
                const dataUrl = await this.capture(pages[i], config, templateId);
                zip.file(`card-${i + 1}.png`, dataUrl.split(',')[1], { base64: true });
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            this.triggerDownload(URL.createObjectURL(blob), `xhs-cards-${Date.now()}.zip`);
            URL.revokeObjectURL(blob);
        });

        if (downloadBtn) downloadBtn.disabled = false;
    }
}
