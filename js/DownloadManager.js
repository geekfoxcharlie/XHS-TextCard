/**
 * DownloadManager
 * 下载管理器 - 负责单张和批量下载功能
 * @version 1.0
 */
class DownloadManager {
    constructor() {
        this.loadingElement = null;
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

    getDownloadOptions() {
        const scale = OUTPUT_WIDTH / PREVIEW_WIDTH;
        return scale === 1
            ? { quality: 1 }
            : { quality: 1, scale };
    }

    async capture(element) {
        return await domtoimage.toPng(element, this.getDownloadOptions());
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

    async download(element, index) {
        if (!element) return;

        await this.withLoading(async () => {
            const dataUrl = await this.capture(element);
            this.triggerDownload(dataUrl, `文字转图片-${index + 1}-${Date.now()}.png`);
        });
    }

    async downloadAll(elements, downloadBtn) {
        if (!elements?.length) return;

        downloadBtn && (downloadBtn.disabled = true);

        await this.withLoading(async () => {
            const zip = new JSZip();
            const promises = elements.map((el, i) =>
                this.capture(el).then(url => {
                    zip.file(`文字转图片-${i + 1}.png`, url.split(',')[1], { base64: true });
                })
            );
            await Promise.all(promises);

            const blob = await zip.generateAsync({ type: 'blob' });
            this.triggerDownload(URL.createObjectURL(blob), `文字转图片-${Date.now()}.zip`);
            URL.revokeObjectURL(blob);
        });

        downloadBtn && (downloadBtn.disabled = false);
    }
}
