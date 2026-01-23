class CanvasRenderer {
    constructor() {
    }

    render(options) {
        const {
            layouts,
            index,
            totalCount,
            config,
            templateId,
            width = PREVIEW_WIDTH,
            height = PREVIEW_HEIGHT,
            scale = 1
        } = options;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        this.drawTemplateBackground(ctx, templateId, config, width, height);

        if (config.hasWatermark) {
            this.drawWatermark(ctx, config, width, height);
        }

        const textAreaRect = this.getTextAreaRect(config, width, height, templateId);
        this.drawTextAreaBackground(ctx, templateId, config, textAreaRect);

        this.drawTextContent(ctx, layouts, config, textAreaRect, templateId);

        this.drawTemplateForeground(ctx, templateId, config, width, height, index, totalCount);

        if (config.hasSignature) {
            this.drawSignature(ctx, config, width, height, templateId);
        }

        return canvas;
    }

    getTextAreaRect(config, width, height, templateId) {
        const padding = parseFloat(config.textPadding) || 35;
        let topOffset = padding;
        
        const template = TemplateDefinitions[templateId];
        if (template && template.getLayout) {
            const layout = template.getLayout(config);
            if (layout.topOffset !== undefined) topOffset = layout.topOffset;
        }
        
        return {
            x: padding,
            y: topOffset,
            width: width - (padding * 2),
            height: height - topOffset - padding
        };
    }

    drawBackground(ctx, config, width, height) {
        ctx.save();
        if (config.bgMode === 'gradient' && typeof config.bgColor === 'string' && config.bgColor.includes('linear-gradient')) {
            const gradient = this.createCanvasGradient(ctx, config.bgColor, width, height);
            ctx.fillStyle = gradient || '#ffffff';
        } else {
            ctx.fillStyle = config.bgColor || '#ffffff';
        }
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }

    createCanvasGradient(ctx, cssGradient, width, height) {
        try {
            const angleMatch = cssGradient.match(/(\d+)deg/);
            const angle = angleMatch ? parseInt(angleMatch[1]) : 135;
            const colors = cssGradient.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\(.*?\))/g);
            if (!colors || colors.length < 2) return null;
            const rad = (angle - 90) * (Math.PI / 180);
            const length = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
            const halfLen = length / 2;
            const centerX = width / 2;
            const centerY = height / 2;
            const x0 = centerX - Math.cos(rad) * halfLen;
            const y0 = centerY - Math.sin(rad) * halfLen;
            const x1 = centerX + Math.cos(rad) * halfLen;
            const y1 = centerY + Math.sin(rad) * halfLen;
            const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(1, colors[colors.length - 1]);
            return gradient;
        } catch (e) { return null; }
    }

    drawTemplateBackground(ctx, templateId, config, width, height) {
        this.drawBackground(ctx, config, width, height);

        const template = TemplateDefinitions[templateId];
        if (template && template.drawBackground) {
            ctx.save();
            template.drawBackground(ctx, width, height, config);
            ctx.restore();
        }
    }

    drawTextAreaBackground(ctx, templateId, config, rect) {
        const template = TemplateDefinitions[templateId];
        if (template && template.drawTextAreaBackground) {
            ctx.save();
            template.drawTextAreaBackground(ctx, rect, config);
            ctx.restore();
        }
    }

    drawTemplateForeground(ctx, templateId, config, width, height, index = 0, totalCount = 1) {
        const template = TemplateDefinitions[templateId];
        if (template && template.drawForeground) {
            ctx.save();
            template.drawForeground(ctx, width, height, index, totalCount);
            ctx.restore();
        }
    }

    drawWatermark(ctx, config, width, height) {
        ctx.save();
        ctx.fillStyle = config.watermarkColor || 'rgba(0,0,0,0.05)';
        ctx.font = '500 14px sans-serif'; ctx.translate(width / 2, height / 2); ctx.rotate(-Math.PI / 6);
        const text = config.watermarkText || '极客狐';
        for (let x = -width; x < width; x += 180) {
            for (let y = -height; y < height; y += 120) { ctx.fillText(text, x, y); }
        }
        ctx.restore();
    }

    drawTextContent(ctx, layouts, config, textAreaRect, templateId) {
        let currentY = textAreaRect.y;
        ctx.save(); ctx.textBaseline = 'top';
        const template = TemplateDefinitions[templateId];

        for (const layout of layouts) {
            if (layout.type === 'space') { currentY += layout.height; continue; }
            const contentY = currentY + (layout.marginTop || 0);
            if (layout.type === 'heading') {
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x, contentY, config, templateId);
            } else if (layout.type === 'blockquote') {
                const indent = layout.indent || 20;
                let quoteBarColor = (template && template.quoteBarColor) || 'rgba(0,0,0,0.1)';
                
                ctx.fillStyle = quoteBarColor;
                ctx.fillRect(textAreaRect.x, contentY, templateId === 'deep-night' ? 2 : 3, layout.height - (layout.marginTop || 0) - (layout.marginBottom || 0));
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x + indent, contentY, config, templateId);
            } else if (layout.type === 'list-item') {
                const fontSize = parseFloat(config.fontSize) || 16;
                const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
                ctx.font = `500 ${fontSize}px ${fontFamily}`;
                
                let prefixColor = (template && template.listPrefixColor) || config.textColor;
                
                ctx.fillStyle = prefixColor;
                ctx.fillText(layout.prefix, textAreaRect.x, contentY);
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x + layout.prefixWidth, contentY, config, templateId);
            } else if (layout.lines) {
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x, contentY, config, templateId);
            }
            currentY += layout.height;
        }
        ctx.restore();
    }

    drawStyledLines(ctx, lines, startX, startY, config, templateId) {
        if (!lines || !Array.isArray(lines)) return;
        let lineY = startY;
        for (const lineSegments of lines) {
            let segmentX = startX;
            const configFontSize = parseFloat(config.fontSize) || 16;
            const maxFontSize = Array.isArray(lineSegments) 
                ? Math.max(...lineSegments.map(s => parseFloat(s.fontSize) || configFontSize))
                : (parseFloat(lineSegments.fontSize) || configFontSize);
            const lineHeight = maxFontSize * (parseFloat(config.lineHeight) || 1.6);
            if (Array.isArray(lineSegments)) {
                for (const segment of lineSegments) {
                    this.drawSegment(ctx, segment, segmentX, lineY, config, templateId);
                    const metrics = ctx.measureText(segment.text);
                    segmentX += metrics.width + (segment.text.length * (parseFloat(config.letterSpacing) || 0));
                }
            } else { this.drawSegment(ctx, lineSegments, segmentX, lineY, config, templateId); }
            lineY += lineHeight;
        }
    }

    drawSegment(ctx, segment, x, y, config, templateId) {
        const fontStyle = segment.fontStyle || 'normal';
        const fontWeight = segment.fontWeight || 'normal';
        const fontSize = parseFloat(segment.fontSize) || parseFloat(config.fontSize) || 16;
        const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        
        let textColor = config.textColor;
        let highlightColor = 'rgba(255, 243, 191, 0.7)';
        let codeBgColor = 'rgba(0,0,0,0.04)';

        const template = TemplateDefinitions[templateId];
        if (template && template.getTextStyles) {
            const styles = template.getTextStyles(segment, config);
            if (styles) {
                if (styles.textColor) textColor = styles.textColor;
                if (styles.highlightColor) highlightColor = styles.highlightColor;
                if (styles.codeBgColor) codeBgColor = styles.codeBgColor;
            }
        }

        const letterSpacing = parseFloat(config.letterSpacing) || 0;
        if (segment.isHighlight) {
            const metrics = ctx.measureText(segment.text);
            const width = metrics.width + (segment.text.length * letterSpacing);
            ctx.fillStyle = highlightColor; ctx.fillRect(x, y + fontSize * 0.1, width, fontSize * 1.1);
        } else if (segment.isCode) {
            const metrics = ctx.measureText(segment.text);
            const width = metrics.width + (segment.text.length * letterSpacing);
            ctx.fillStyle = codeBgColor;
            CanvasRenderer.utils.drawRoundedRect(ctx, x - 2, y + 1, width + 4, fontSize * 1.3, 4, ctx.fillStyle);
        }
        ctx.fillStyle = textColor; ctx.fillText(segment.text, x, y);

        if (segment.textDecoration === 'line-through') {
            const metrics = ctx.measureText(segment.text);
            const width = metrics.width + (segment.text.length * letterSpacing);
            ctx.strokeStyle = textColor;
            ctx.lineWidth = Math.max(1, fontSize / 14);
            ctx.beginPath();
            ctx.moveTo(x, y + fontSize * 0.52);
            ctx.lineTo(x + width, y + fontSize * 0.52);
            ctx.stroke();
        }
    }

    drawSignature(ctx, config, width, height, templateId) {
        const sigText = config.signatureText || '极客狐';
        const sigColor = config.signatureColor || '#555555';
        const sigStyle = config.signatureStyle || 'modern-pill';
        const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
        const template = TemplateDefinitions[templateId];

        ctx.save();
        if (sigStyle === 'terminal') {
            let barBg = '#222';
            let cursorColor = '#39FF14';
            if (template && template.terminalStyles) {
                if (template.terminalStyles.bg) barBg = template.terminalStyles.bg;
                if (template.terminalStyles.text) cursorColor = template.terminalStyles.text;
            }

            const barHeight = 40; ctx.fillStyle = barBg; ctx.fillRect(0, height - barHeight, width, barHeight);
            ctx.font = '700 13px monospace'; 
            ctx.fillStyle = cursorColor; 
            ctx.textAlign = 'left'; ctx.fillText('> _', 25, height - barHeight / 2 + 5);
            ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(sigText, width - 25, height - barHeight / 2 + 5);
        } else if (sigStyle === 'modern-pill') {
            ctx.font = `600 13px ${fontFamily}`; const metrics = ctx.measureText(sigText); const pillWidth = metrics.width + 40; const pillHeight = 30;
            const pillX = (width - pillWidth) / 2; const pillY = height - 42;
            CanvasRenderer.utils.drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 15, sigColor);
            ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText(sigText, width / 2, pillY + pillHeight / 2 + 5);
        } else if (sigStyle === 'elegant-serif') {
            ctx.font = `italic 600 15px serif`; const metrics = ctx.measureText(sigText); const textWidth = metrics.width; const lineWidth = 40; const gap = 12;
            const totalWidth = textWidth + (lineWidth + gap) * 2; const startX = (width - totalWidth) / 2; const y = height - 35;
            ctx.strokeStyle = sigColor; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(startX + lineWidth, y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(width - startX - lineWidth, y); ctx.lineTo(width - startX, y); ctx.stroke();
            ctx.fillStyle = sigColor; ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.fillText(sigText, width / 2, y + 6);
        } else if (sigStyle === 'glass-minimal') {
            ctx.font = `600 13px ${fontFamily}`; const metrics = ctx.measureText(sigText); const boxWidth = metrics.width + 30; const boxHeight = 32;
            const x = (width - boxWidth) / 2; const y = height - 45;
            CanvasRenderer.utils.drawRoundedRect(ctx, x, y, boxWidth, boxHeight, 16, 'rgba(255, 255, 255, 0.25)', true, 'rgba(255, 255, 255, 0.2)');
            ctx.fillStyle = sigColor; ctx.textAlign = 'center'; ctx.fillText(sigText, width / 2, y + boxHeight / 2 + 5);
        } else { ctx.fillStyle = sigColor; ctx.font = `600 13px ${fontFamily}`; ctx.textAlign = 'center'; ctx.fillText(sigText, width / 2, height - 30); }
        ctx.restore();
    }
}

CanvasRenderer.utils = {
    drawRoundedRect: (ctx, x, y, width, height, radius, fillStyle, stroke = false, strokeStyle = '') => {
        const r = typeof radius === 'number' ? {tl: radius, tr: radius, bl: radius, br: radius} : radius;
        ctx.beginPath();
        ctx.moveTo(x + r.tl, y);
        ctx.lineTo(x + width - r.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
        ctx.lineTo(x + width, y + height - r.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
        ctx.lineTo(x + r.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
        ctx.lineTo(x, y + r.tl);
        ctx.quadraticCurveTo(x, y, x + r.tl, y);
        ctx.closePath();
        if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = 1; ctx.stroke(); }
    }
};
