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
        
        if (templateId === 'ios-memo') topOffset = 65; 
        else if (templateId === 'pro-doc') topOffset = 60;
        else if (templateId === 'deep-night') topOffset = padding + 25;
        else if (templateId === 'minimalist-magazine') topOffset = 80;
        
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

        if (templateId === 'aura-gradient') {
            this.drawAuraGradient(ctx, width, height);
        } else if (templateId === 'deep-night') {
            ctx.save();
            const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
            grad.addColorStop(0, '#1a1a1a');
            grad.addColorStop(1, '#050505');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            const lineGrad = ctx.createLinearGradient(0, 0, 0, height);
            lineGrad.addColorStop(0, 'transparent');
            lineGrad.addColorStop(0.2, '#00F5FF');
            lineGrad.addColorStop(0.8, '#00F5FF');
            lineGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lineGrad;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, 3, height);
            ctx.restore();
        } else if (templateId === 'swiss-studio') {
            ctx.save(); ctx.fillStyle = '#FF4500'; ctx.fillRect(0, 0, 6, height); ctx.restore();
        } else if (templateId === 'pro-doc') {
            ctx.save(); ctx.strokeStyle = 'rgba(0,102,255,0.02)'; ctx.lineWidth = 0.5;
            for(let i=0; i<width; i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
            for(let j=0; j<height; j+=20){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width,j); ctx.stroke(); }
            ctx.restore();
        }
    }

    drawAuraGradient(ctx, width, height) {
        ctx.save();
        const auras = [
            { x: 0, y: 0, r: 1, c1: 'rgba(255, 195, 160, 0.3)', c2: 'rgba(255, 195, 160, 0)' },
            { x: 1, y: 0.2, r: 0.8, c1: 'rgba(255, 175, 189, 0.25)', c2: 'rgba(255, 175, 189, 0)' },
            { x: 0.5, y: 1, r: 1.2, c1: 'rgba(33, 147, 176, 0.15)', c2: 'rgba(33, 147, 176, 0)' },
            { x: 0, y: 0.8, r: 0.7, c1: 'rgba(238, 156, 167, 0.2)', c2: 'rgba(238, 156, 167, 0)' },
            { x: 0.8, y: 0.9, r: 0.6, c1: 'rgba(165, 94, 234, 0.15)', c2: 'rgba(165, 94, 234, 0)' }
        ];

        auras.forEach(aura => {
            const grad = ctx.createRadialGradient(
                width * aura.x, height * aura.y, 0,
                width * aura.x, height * aura.y, width * aura.r
            );
            grad.addColorStop(0, aura.c1);
            grad.addColorStop(1, aura.c2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        });

        ctx.globalAlpha = 0.02;
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
            ctx.fillRect(x, y, 1, 1);
        }
        ctx.restore();
    }

    drawTextAreaBackground(ctx, templateId, config, rect) {
        ctx.save();
        if (templateId === 'ios-memo') {
            ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5;
            this.drawRoundedRect(ctx, 15, 55, PREVIEW_WIDTH - 30, PREVIEW_HEIGHT - 110, 12, '#ffffff');
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            ctx.strokeStyle = '#F2F2F7'; ctx.lineWidth = 1;
            const lineSpacing = (parseFloat(config.fontSize) || 18) * 1.6;
            for (let y = rect.y + lineSpacing; y < rect.y + rect.height; y += lineSpacing) {
                ctx.beginPath(); ctx.moveTo(rect.x, y); ctx.lineTo(rect.x + rect.width, y); ctx.stroke();
            }
        } else if (templateId === 'pro-doc') {
            ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
            this.drawRoundedRect(ctx, rect.x - 10, rect.y - 30, rect.width + 20, rect.height + 40, 12, '#ffffff', true, 'rgba(0,0,0,0.05)');
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            ctx.fillStyle = '#F3F4F6';
            this.drawRoundedRect(ctx, rect.x - 10, rect.y - 30, rect.width + 20, 30, {tl: 12, tr: 12, bl: 0, br: 0}, '#F3F4F6');
            const btnY = rect.y - 15;
            ctx.fillStyle = '#FF5F56'; ctx.beginPath(); ctx.arc(rect.x + 10, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFBD2E'; ctx.beginPath(); ctx.arc(rect.x + 28, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#27C93F'; ctx.beginPath(); ctx.arc(rect.x + 46, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#9CA3AF'; ctx.font = '700 10px -apple-system, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('DOCUMENT VIEWER', rect.x + rect.width/2, rect.y - 11);
        } else if (templateId === 'deep-night') {
            this.drawRoundedRect(ctx, rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20, 16, 'rgba(255,255,255,0.02)', true, 'rgba(255,255,255,0.05)');
        } else if (templateId === 'creamy-latte') {
            this.drawRoundedRect(ctx, rect.x - 15, rect.y - 15, rect.width + 30, rect.height + 30, 24, 'rgba(255, 255, 255, 0.75)', true, 'rgba(232, 213, 196, 0.2)');
        } else if (templateId === 'aura-gradient') {
            ctx.shadowColor = 'rgba(0,0,0,0.03)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 10;
            this.drawRoundedRect(ctx, rect.x - 12, rect.y - 12, rect.width + 24, rect.height + 24, 28, 'rgba(255, 255, 255, 0.5)', true, 'rgba(255, 255, 255, 0.4)');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            this.drawRoundedRect(ctx, rect.x - 12, rect.y - 12, rect.width + 24, rect.height + 24, 28, null, true);
        } else if (templateId === 'swiss-studio') {
            ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5;
            for(let x = rect.x; x < rect.x + rect.width; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, rect.y); ctx.lineTo(x, rect.y + rect.height); ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, stroke = false, strokeStyle = '') {
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

    drawTemplateForeground(ctx, templateId, config, width, height, index = 0, totalCount = 1) {
        ctx.save();
        if (templateId === 'ios-memo') {
            ctx.fillStyle = '#FF9500'; ctx.font = '500 17px -apple-system, sans-serif';
            ctx.textAlign = 'right'; ctx.fillText('完成', width - 25, 35);
            ctx.textAlign = 'left'; ctx.beginPath(); ctx.strokeStyle = '#FF9500'; ctx.lineWidth = 2.5;
            ctx.moveTo(25, 33); ctx.lineTo(18, 26); ctx.lineTo(25, 19); ctx.stroke();
            ctx.fillText('备忘录', 32, 35);
            ctx.fillStyle = '#8E8E93'; ctx.font = '500 12px -apple-system, sans-serif';
            ctx.textAlign = 'center'; ctx.fillText('2026年1月22日 12:00', width / 2, 25);
        } else if (templateId === 'minimalist-magazine') {
            ctx.save();
            ctx.fillStyle = '#1A1A1A';
            ctx.font = '800 11px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('EDITORIAL / PERSPECTIVE', 45, 45);
            ctx.font = '500 11px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`VOL. 2026 / NO. ${String(index + 1).padStart(2, '0')}`, width - 45, 45);
            ctx.strokeStyle = '#1A1A1A';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(45, 55);
            ctx.lineTo(width - 45, 55);
            ctx.stroke();
            ctx.fillStyle = '#999';
            ctx.font = 'italic 500 10px Georgia, serif';
            ctx.textAlign = 'right';
            ctx.fillText(`PAGE ${index + 1} OF ${totalCount}`, width - 45, height - 25);
            ctx.restore();
        } else if (templateId === 'swiss-studio') {
            ctx.fillStyle = '#1A1A1A'; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right';
            ctx.fillText('REF. CH-8004', width - 25, 25);
            ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = '#FF4500'; ctx.lineWidth = 2; ctx.stroke();
        } else if (templateId === 'pro-doc') {
            ctx.fillStyle = '#6B7280'; ctx.font = '700 9px -apple-system, sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 25, 25);
        } else if (templateId === 'deep-night') {
            ctx.fillStyle = '#444'; ctx.font = '800 10px Inter, sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('THOUGHT MODE ON //', width - 25, 30);
            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke();
        }
        ctx.restore();
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
        for (const layout of layouts) {
            if (layout.type === 'space') { currentY += layout.height; continue; }
            const contentY = currentY + (layout.marginTop || 0);
            if (layout.type === 'heading') {
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x, contentY, config, templateId);
            } else if (layout.type === 'blockquote') {
                const indent = layout.indent || 20;
                ctx.fillStyle = templateId === 'deep-night' ? '#00F5FF' : (templateId === 'swiss-studio' ? '#FF4500' : (templateId === 'pro-doc' ? '#0066FF' : 'rgba(0,0,0,0.1)'));
                ctx.fillRect(textAreaRect.x, contentY, templateId === 'deep-night' ? 2 : 3, layout.height - (layout.marginTop || 0) - (layout.marginBottom || 0));
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x + indent, contentY, config, templateId);
            } else if (layout.type === 'list-item') {
                const fontSize = parseFloat(config.fontSize) || 16;
                const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
                ctx.font = `500 ${fontSize}px ${fontFamily}`;
                ctx.fillStyle = (templateId === 'swiss-studio' && layout.prefix === '• ') ? '#FF4500' : ((templateId === 'pro-doc' && layout.prefix === '• ') ? '#0066FF' : (templateId === 'deep-night' ? '#00F5FF' : config.textColor));
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
        if (templateId === 'pro-doc') {
            if (fontWeight === '700' || fontWeight === '800' || segment.isHighlight) { 
                textColor = '#0066FF'; highlightColor = 'rgba(0, 102, 255, 0.04)'; 
            }
        } else if (templateId === 'deep-night') {
            if (fontWeight === '700' || fontWeight === '800' || segment.isHighlight || segment.isCode) { 
                textColor = '#00F5FF'; highlightColor = 'rgba(0, 245, 255, 0.05)';
            }
        } else if (templateId === 'creamy-latte' && segment.isHighlight) { highlightColor = 'rgba(232, 213, 196, 0.5)';
        } else if (templateId === 'minimalist-magazine' && (fontWeight === '700' || fontWeight === '800')) { textColor = '#000'; highlightColor = 'rgba(0,0,0,0.05)';
        } else if (templateId === 'swiss-studio') {
            if (fontWeight === '700' || fontWeight === '800') textColor = '#000';
            if (segment.isHighlight) { highlightColor = '#FF4500'; textColor = '#FFF'; }
        }

        const letterSpacing = parseFloat(config.letterSpacing) || 0;
        if (segment.isHighlight) {
            const metrics = ctx.measureText(segment.text);
            const width = metrics.width + (segment.text.length * letterSpacing);
            ctx.fillStyle = highlightColor; ctx.fillRect(x, y + fontSize * 0.1, width, fontSize * 1.1);
        } else if (segment.isCode) {
            const metrics = ctx.measureText(segment.text);
            const width = metrics.width + (segment.text.length * letterSpacing);
            ctx.fillStyle = templateId === 'deep-night' ? 'rgba(0, 245, 255, 0.08)' : 'rgba(0,0,0,0.04)';
            this.drawRoundedRect(ctx, x - 2, y + 1, width + 4, fontSize * 1.3, 4, ctx.fillStyle);
        }
        ctx.fillStyle = textColor; ctx.fillText(segment.text, x, y);
    }

    drawSignature(ctx, config, width, height, templateId) {
        const sigText = config.signatureText || '极客狐';
        const sigColor = config.signatureColor || '#555555';
        const sigStyle = config.signatureStyle || 'modern-pill';
        const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
        ctx.save();
        if (sigStyle === 'terminal') {
            const barHeight = 40; ctx.fillStyle = (templateId === 'deep-night') ? '#050505' : '#222'; ctx.fillRect(0, height - barHeight, width, barHeight);
            ctx.font = '700 13px monospace'; 
            ctx.fillStyle = (templateId === 'deep-night') ? '#00F5FF' : '#39FF14'; 
            ctx.textAlign = 'left'; ctx.fillText('> _', 25, height - barHeight / 2 + 5);
            ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(sigText, width - 25, height - barHeight / 2 + 5);
        } else if (sigStyle === 'modern-pill') {
            ctx.font = `600 13px ${fontFamily}`; const metrics = ctx.measureText(sigText); const pillWidth = metrics.width + 40; const pillHeight = 30;
            const pillX = (width - pillWidth) / 2; const pillY = height - 42;
            this.drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 15, sigColor);
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
            this.drawRoundedRect(ctx, x, y, boxWidth, boxHeight, 16, 'rgba(255, 255, 255, 0.25)', true, 'rgba(255, 255, 255, 0.2)');
            ctx.fillStyle = sigColor; ctx.textAlign = 'center'; ctx.fillText(sigText, width / 2, y + boxHeight / 2 + 5);
        } else { ctx.fillStyle = sigColor; ctx.font = `600 13px ${fontFamily}`; ctx.textAlign = 'center'; ctx.fillText(sigText, width / 2, height - 30); }
        ctx.restore();
    }
}
