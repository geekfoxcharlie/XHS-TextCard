/**
 * CanvasRenderer - 核心画布渲染引擎
 * 
 * 设计原则：
 * 1. 声明式渲染：通过 Render Options 描述期望的画布状态。
 * 2. 分层绘制：严格遵循 背景 -> 文本背景 -> 水印 -> 文本 -> 前景 -> 签名 的层级顺序。
 * 3. 模板隔离：具体的视觉逻辑由 TemplateDefinitions 定义，渲染器仅负责调用和基础绘图。
 * 4. 高清适配：支持 Scale 参数进行预览与高清输出的无损切换。
 */
class CanvasRenderer {
    constructor() {
        this.imageCache = new Map();
    }

    /**
     * 加载图片并缓存
     */
    async loadImage(src) {
        if (this.imageCache.has(src)) return this.imageCache.get(src);
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    async render(options) {
        const {
            layouts, index, totalCount, config, templateId,
            width = PREVIEW_WIDTH, height = PREVIEW_HEIGHT, scale = 1
        } = options;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        // 1. 预加载必要的图片 (如封面、正文插图)
        const imageLoadPromises = [];
        layouts.forEach(layout => {
            if (layout.type === 'cover' && layout.image) {
                imageLoadPromises.push(this.loadImage(layout.image));
            } else if (layout.type === 'image' && layout.src) {
                imageLoadPromises.push(this.loadImage(layout.src));
            }
        });
        await Promise.all(imageLoadPromises);

        // 2. 绘制基础背景
        this.drawTemplateBackground(ctx, templateId, config, width, height);

        // 3. 绘制文本区域背景 (如备忘录纸张、模拟窗口)
        const textAreaRect = this.getTextAreaRect(config, width, height, templateId);
        this.drawTextAreaBackground(ctx, templateId, config, textAreaRect);

        // 4. 绘制水印 (位于文字之下)
        if (config.hasWatermark) {
            this.drawWatermark(ctx, config, width, height);
        }

        // 5. 核心内容渲染 (封面或普通文本)
        if (layouts.length === 1 && layouts[0].type === 'cover') {
            this.drawCoverContent(ctx, layouts[0], config, width, height, templateId);
        } else {
            this.drawTextContent(ctx, layouts, config, textAreaRect, templateId);
        }

        // 6. 绘制模板前景 (如顶部装饰、边框)
        const isCover = layouts.length === 1 && layouts[0].type === 'cover';
        this.drawTemplateForeground(ctx, templateId, config, width, height, index, totalCount, isCover);

        // 7. 绘制签名栏
        if (config.hasSignature) {
            this.drawSignature(ctx, config, width, height, templateId);
        }

        // 8. 辅助网格 (辅助排版对齐)
        if (config.showGrid) {
            this.drawGridLayout(ctx, textAreaRect, layouts);
        }

        return canvas;
    }

    /**
     * 绘制图文封面 - 上下分栏风格
     * 上 60%: 图片
     * 下 40%: 标题
     */
    drawCoverContent(ctx, layout, config, width, height, templateId) {
        const img = this.imageCache.get(layout.image);
        const padding = parseFloat(config.textPadding) || 40;
        
        // 定义分栏比例 (0.6 = 60% 图片高度)
        const splitRatio = 0.6;
        const imageH = height * splitRatio;
        const textH = height - imageH;
        const textY = imageH;

        ctx.save();
        
        // 1. 绘制上半部分：图片
        if (img) {
            const scale = Math.max(width / img.width, imageH / img.height);
            const x = (width / 2) - (img.width / 2) * scale;
            const y = (imageH / 2) - (img.height / 2) * scale;
            
            ctx.beginPath();
            ctx.rect(0, 0, width, imageH);
            ctx.clip();
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // 可选：添加轻微内阴影增加层次感
            // ctx.shadowColor = 'rgba(0,0,0,0.1)';
            // ctx.shadowBlur = 20;
            // ctx.shadowOffsetY = 5;
            // ctx.shadowOffsetX = 0;
            // ctx.rect(0, 0, width, imageH);
            // ctx.stroke();
            
            ctx.restore(); // 恢复 clip
        } else {
            // 占位图
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, width, imageH);
            ctx.fillStyle = '#ccc';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('请上传封面图片', width / 2, imageH / 2);
        }

        // 2. 绘制下半部分：标题
        // 背景色已经由 drawTemplateBackground 绘制，此处只需绘制文字
        
        ctx.save();
        
        const fontSize = parseFloat(config.coverFontSize) || 48;
        const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
        
        // 字体颜色使用 accentColor (强调色)
        ctx.fillStyle = config.accentColor || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `800 ${fontSize}px ${fontFamily}`;
        
        // 简单的自动换行处理
        const maxWidth = width - (padding * 2);
        const words = layout.title.split('');
        let line = '';
        const lines = [];
        
        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n];
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n];
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        const lineHeight = fontSize * 1.4;
        const totalTextHeight = lines.length * lineHeight;
        // 垂直居中于下半部分
        let startY = textY + (textH / 2) - (totalTextHeight / 2) + (fontSize * 0.4);
        
        lines.forEach((l, i) => {
            ctx.shadowColor = 'transparent'; // 移除阴影
            ctx.fillText(l, width / 2, startY + (i * lineHeight));
        });

        // 3. 模板特定装饰器 (适配新布局)
        if (templateId === 'minimalist-magazine') {
            ctx.font = 'bold 14px "Source Han Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = config.accentColor || '#000';
            // 移到文字区域左上角
            ctx.fillText('SPECIAL EDITION', padding, textY + 40);
            
            ctx.beginPath();
            ctx.moveTo(padding, textY + 55);
            ctx.lineTo(padding + 100, textY + 55);
            ctx.strokeStyle = config.accentColor || '#000';
            ctx.stroke();

        } else if (templateId === 'swiss-studio') {
             // 左侧色条保持通栏
             ctx.fillStyle = config.accentColor || '#FF4500';
             ctx.fillRect(0, 0, 10, height);

        } else if (templateId === 'deep-night') {
             // 边框装饰保持全屏
             ctx.strokeStyle = config.accentColor || '#00F5FF';
             ctx.lineWidth = 2;
             ctx.strokeRect(20, 20, width - 40, height - 40);
        }
        
        ctx.restore();
    }

    /**
     * 绘制辅助网格，用于排版对齐查看
     */
    drawGridLayout(ctx, textAreaRect, layouts) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(textAreaRect.x, textAreaRect.y, textAreaRect.width, textAreaRect.height);
        
        let currentY = textAreaRect.y;
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)';
        
        layouts.forEach(layout => {
            if (layout.type !== 'space') {
                const y = currentY + (layout.marginTop || 0);
                const h = layout.height - (layout.marginTop || 0) - (layout.marginBottom || 0);
                ctx.strokeRect(textAreaRect.x, y, textAreaRect.width, h);
            }
            currentY += layout.height;
        });
        ctx.restore();
    }

    /**
     * 获取内容框位置，遵循 TemplateDefinitions 的唯一真理
     */
    getTextAreaRect(config, width, height, templateId) {
        if (typeof TemplateDefinitions.getContentBox === 'function') {
             return TemplateDefinitions.getContentBox(templateId, config, width, height);
        }
        const padding = parseFloat(config.textPadding) || 35;
        return { x: padding, y: padding, width: width - (padding * 2), height: height - (padding * 2) };
    }

    drawBackground(ctx, config, width, height) {
        ctx.save();
        if (config.bgMode === 'gradient' && typeof config.bgColor === 'string' && config.bgColor.includes('linear-gradient')) {
            const gradient = CanvasUtils.createGradient(ctx, config.bgColor, width, height);
            ctx.fillStyle = gradient || '#ffffff';
        } else {
            ctx.fillStyle = config.bgColor || '#ffffff';
        }
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
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

    drawTemplateForeground(ctx, templateId, config, width, height, index = 0, totalCount = 1, isCover = false) {
        if (isCover) return; // 封面不绘制页码等通用装饰
        
        const template = TemplateDefinitions[templateId];
        if (template && template.drawForeground) {
            ctx.save();
            template.drawForeground(ctx, width, height, index, totalCount, config);
            ctx.restore();
        }
    }

    drawWatermark(ctx, config, width, height) {
        ctx.save();
        ctx.fillStyle = config.watermarkColor || 'rgba(0,0,0,0.05)';
        ctx.font = '500 14px sans-serif';
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 6);
        const text = config.watermarkText || DEFAULT_BRAND_TEXT;
        for (let x = -width; x < width; x += 180) {
            for (let y = -height; y < height; y += 120) {
                ctx.fillText(text, x, y);
            }
        }
        ctx.restore();
    }

    drawTextContent(ctx, layouts, config, textAreaRect, templateId) {
        let currentY = textAreaRect.y;
        ctx.save();
        ctx.textBaseline = 'top';
        const template = TemplateDefinitions[templateId];

        for (const layout of layouts) {
            if (layout.type === 'space') {
                currentY += layout.height;
                continue;
            }
            const contentY = currentY + (layout.marginTop || 0);
            if (layout.type === 'heading') {
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x, contentY, config, templateId);
            } else if (layout.type === 'blockquote') {
                const indent = layout.indent || 20;
                let quoteBarColor = config.accentColor || 'rgba(0,0,0,0.1)';
                ctx.fillStyle = quoteBarColor;
                ctx.fillRect(textAreaRect.x, contentY, templateId === 'deep-night' ? 2 : 3, layout.height - (layout.marginTop || 0) - (layout.marginBottom || 0));
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x + indent, contentY, config, templateId);
            } else if (layout.type === 'list-item') {
                const fontSize = parseFloat(config.fontSize) || 16;
                const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
                ctx.font = `500 ${fontSize}px ${fontFamily}`;
                let prefixColor = config.accentColor || config.textColor;
                ctx.fillStyle = prefixColor;
                ctx.fillText(layout.prefix, textAreaRect.x, contentY);
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x + layout.prefixWidth, contentY, config, templateId);
            } else if (layout.type === 'image') {
                this.drawInlineImage(ctx, layout, textAreaRect.x, contentY);
            } else if (layout.lines) {
                this.drawStyledLines(ctx, layout.lines, textAreaRect.x, contentY, config, templateId);
            }
            currentY += layout.height;
        }
        ctx.restore();
    }

    /**
     * 绘制正文中的图片
     */
    drawInlineImage(ctx, layout, x, y) {
        const img = this.imageCache.get(layout.src);
        if (img) {
            const drawH = layout.contentHeight;
            const drawW = layout.width;
            
            ctx.save();
            // 绘制圆角图片
            ctx.beginPath();
            CanvasUtils.drawRoundedRect(ctx, x, y, drawW, drawH, 8);
            ctx.clip();
            ctx.drawImage(img, x, y, drawW, drawH);
            ctx.restore();
        } else {
            // 绘制占位符
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(x, y, layout.width, layout.contentHeight);
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('图片加载失败', x + layout.width / 2, y + layout.contentHeight / 2);
        }
    }

    drawStyledLines(ctx, lines, startX, startY, config, templateId) {
        if (!lines || !Array.isArray(lines)) return;
        let lineY = startY;
        const configFontSize = parseFloat(config.fontSize) || 16;

        for (const lineSegments of lines) {
            let segmentX = startX;
            let maxFontSize = configFontSize;
            
            if (Array.isArray(lineSegments) && lineSegments.length > 0) {
                maxFontSize = Math.max(...lineSegments.map(s => parseFloat(s.fontSize) || configFontSize));
            } else if (lineSegments && lineSegments.fontSize) {
                maxFontSize = parseFloat(lineSegments.fontSize);
            }

            const lineHeight = maxFontSize * (parseFloat(config.lineHeight) || 1.6);
            const letterSpacing = parseFloat(config.letterSpacing) || 0;

            if (Array.isArray(lineSegments)) {
                for (const segment of lineSegments) {
                    this.drawSegment(ctx, segment, segmentX, lineY, config, templateId);
                    segmentX += CanvasUtils.measureTextWidth(ctx, segment.text, letterSpacing);
                }
            } else {
                this.drawSegment(ctx, lineSegments, segmentX, lineY, config, templateId);
            }
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
        const metrics = ctx.measureText(segment.text);
        const width = metrics.width + (segment.text.length * letterSpacing);

        if (segment.isHighlight) {
            ctx.fillStyle = highlightColor;
            ctx.fillRect(x, y + fontSize * 0.1, width, fontSize * 1.1);
        } else if (segment.isCode) {
            ctx.fillStyle = codeBgColor;
            CanvasUtils.drawRoundedRect(ctx, x - 2, y + 1, width + 4, fontSize * 1.3, 4, ctx.fillStyle);
        }

        ctx.fillStyle = textColor;
        ctx.fillText(segment.text, x, y);

        if (segment.textDecoration === 'line-through') {
            ctx.strokeStyle = textColor;
            ctx.lineWidth = Math.max(1, fontSize / 14);
            ctx.beginPath();
            ctx.moveTo(x, y + fontSize * 0.52);
            ctx.lineTo(x + width, y + fontSize * 0.52);
            ctx.stroke();
        }
    }

    drawSignature(ctx, config, width, height, templateId) {
        const sigText = config.signatureText || DEFAULT_BRAND_TEXT;
        const sigColor = config.signatureColor || '#555555';
        const sigStyle = config.signatureStyle || 'modern-pill';
        const fontFamily = config.fontFamily === 'inherit' ? "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" : (config.fontFamily || "sans-serif");
        const template = TemplateDefinitions[templateId];

        ctx.save();
        if (sigStyle === 'terminal') {
            let barBg = '#222';
            let cursorColor = '#39FF14';
            if (template && template.terminalStyles) {
                const styles = typeof template.terminalStyles === 'function' ? template.terminalStyles(config) : template.terminalStyles;
                if (styles.bg) barBg = styles.bg;
                if (styles.text) cursorColor = styles.text;
            }

            const barHeight = 40;
            ctx.fillStyle = barBg;
            ctx.fillRect(0, height - barHeight, width, barHeight);
            ctx.font = '700 13px monospace'; 
            ctx.fillStyle = cursorColor; 
            ctx.textAlign = 'left';
            ctx.fillText('> _', 25, height - barHeight / 2 + 5);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.fillText(sigText, width - 25, height - barHeight / 2 + 5);
        } else if (sigStyle === 'modern-pill') {
            ctx.font = `600 13px ${fontFamily}`;
            const metrics = ctx.measureText(sigText);
            const pillWidth = metrics.width + 40;
            const pillHeight = 30;
            const pillY = height - 42;
            CanvasUtils.drawRoundedRect(ctx, (width - pillWidth) / 2, pillY, pillWidth, pillHeight, 15, sigColor);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, pillY + pillHeight / 2 + 5);
        } else if (sigStyle === 'elegant-serif') {
            ctx.font = `italic 600 15px serif`;
            const textWidth = ctx.measureText(sigText).width;
            const lineWidth = 40, gap = 12;
            const startX = (width - (textWidth + (lineWidth + gap) * 2)) / 2;
            const y = height - 35;
            ctx.strokeStyle = sigColor;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, y); ctx.lineTo(startX + lineWidth, y);
            ctx.moveTo(width - startX - lineWidth, y); ctx.lineTo(width - startX, y);
            ctx.stroke();
            ctx.fillStyle = sigColor; ctx.globalAlpha = 1; ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, y + 6);
        } else if (sigStyle === 'glass-minimal') {
            ctx.font = `600 13px ${fontFamily}`;
            const boxWidth = ctx.measureText(sigText).width + 30;
            const boxHeight = 32, y = height - 45;
            CanvasUtils.drawRoundedRect(ctx, (width - boxWidth) / 2, y, boxWidth, boxHeight, 16, 'rgba(255, 255, 255, 0.25)', true, 'rgba(255, 255, 255, 0.2)');
            ctx.fillStyle = sigColor; ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, y + boxHeight / 2 + 5);
        } else {
            ctx.fillStyle = sigColor; ctx.font = `600 13px ${fontFamily}`; ctx.textAlign = 'center';
            ctx.fillText(sigText, width / 2, height - 30);
        }
        ctx.restore();
    }
}
