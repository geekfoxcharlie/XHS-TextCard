/**
 * PreviewGenerator
 * 预览生成器 - 负责卡片 HTML 结构的生成与样式注入
 * @version 1.0
 */
class PreviewGenerator {
    constructor(templateManager) {
        this.templateManager = templateManager;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    applyTemplateVariables(container, config) {
        container.style.setProperty('--template-bg-color', config.bgColor);
        container.style.setProperty('--template-signature-color', config.signatureColor);
        container.style.setProperty('--template-watermark-color', config.watermarkColor);
        
        if (config.bgMode === 'gradient') {
            container.classList.add('bg-mode-gradient');
        } else if (config.bgMode === 'glass' && config.bgImage) {
            container.classList.add('bg-mode-glass');
            container.style.setProperty('--template-bg-image', `url(${config.bgImage})`);
        } else {
            container.classList.add('bg-mode-solid');
        }
    }

    applyTextVariables(textLayer, config) {
        textLayer.style.setProperty('--template-text-color', config.textColor);
        textLayer.style.setProperty('--template-font-size', config.fontSize + 'px');
        textLayer.style.setProperty('--template-line-height', config.lineHeight);
        textLayer.style.setProperty('--template-letter-spacing', config.letterSpacing + 'px');
        textLayer.style.setProperty('--template-font-family', config.fontFamily);
        textLayer.style.setProperty('--text-padding', config.textPadding + 'px');
    }

    getSignatureHtml(config) {
        if (!config.hasSignature) return '';

        const signatureStyle = config.signatureStyle || 'modern-pill';
        const signatureText = config.signatureText || '极客狐';

        const styles = {
            'terminal': () => `
                <div class="sig-left">
                    <span class="sig-prefix">&gt;</span><span class="sig-cursor">_</span>
                </div>
                <div class="sig-right">${signatureText}</div>
            `,
            'modern-pill': () => `
                <div class="sig-pill">
                    <i class="fas fa-at"></i>
                    <span>${signatureText}</span>
                </div>
            `,
            'elegant-serif': () => `
                <div class="sig-wrap">
                    <div class="sig-line"></div>
                    <div class="sig-text">${signatureText}</div>
                    <div class="sig-line"></div>
                </div>
            `,
            'glass-minimal': () => `
                <div class="sig-content">
                    <i class="fas fa-pen-nib sig-icon"></i>
                    <span>${signatureText}</span>
                </div>
            `
        };

        const content = (styles[signatureStyle] || (() => `<div class="sig-content">${this.escapeHtml(signatureText)}</div>`))();
        return `<div class="signature-bar style-${signatureStyle}">${content}</div>`;
    }

    getWatermarkHtml(config) {
        if (!config.hasWatermark) return '';

        const watermarkText = this.escapeHtml(config.watermarkText || '极客狐');
        let watermarkHtml = '<div class="watermark-overlay style-default">';
        for (let i = 0; i < 12; i++) {
            watermarkHtml += `<span class="watermark-text">${watermarkText}</span>`;
        }
        watermarkHtml += '</div>';
        return watermarkHtml;
    }

    createPreviewItem(text, index, totalCount, templateId, config, onDownload) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        const template = this.templateManager.getTemplate(templateId);

        if (!template) return item;

        const parsedContent = MarkdownParser.parseIfNeeded(text);

        const html = `
<div class="preview-item-header">
<div class="preview-item-title">第 ${index + 1} 张 / 共 ${totalCount} 张</div>
<div class="preview-item-actions">
<button class="btn-small" data-index="${index}" data-action="download">下载</button>
</div>
</div>
<div class="preview-image-wrapper">
    <div class="template-layer template-${templateId}" data-index="${index}">
        <div class="text-layer">
            ${parsedContent}
        </div>
        ${this.getWatermarkHtml(config)}
        ${this.getSignatureHtml(config)}
    </div>
</div>`;

        item.innerHTML = html;
        const templateLayer = item.querySelector('.template-layer');
        const textLayer = item.querySelector('.text-layer');

        this.applyTemplateVariables(templateLayer, config);
        this.applyTextVariables(textLayer, config);

        const downloadBtn = item.querySelector('[data-action="download"]');
        downloadBtn.addEventListener('click', () => {
            onDownload(index);
        });

        return item;
    }

}

