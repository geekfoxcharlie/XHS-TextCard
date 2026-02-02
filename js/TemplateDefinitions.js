/**
 * TemplateDefinitions
 * 定义每个模板特有的 Canvas 绘制逻辑和布局参数
 * 
 * 模板设计规范 (Template Design Standards):
 * 1. 颜色变量统一：所有模板必须严格遵守 'textColor' (正文色) 和 'accentColor' (强调色) 的双色系统。
 * 2. 职责分离：
 *    - textColor: 负责所有普通段落、列表文本、引用文本以及基础装饰性 UI (如边框、辅助文字、模拟窗口背景)。
 *    - accentColor: 负责所有强调内容，包括：标题 (Headings)、加粗 (Bold)、高亮 (Highlight) 文本或背景、列表符号 (List Markers)、引用竖线 (Quote Bars)。
 * 3. 模板独立性：装饰性的固定 UI (如模拟按钮、页眉页脚) 除非设计需要，否则不应受强调色控制，以维持模板本身的视觉识别度。
 */
const TemplateDefinitions = {
    'blank': {
        /**
         * 空白模板 - 极致简约，回归文字本质
         */
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            }
            return { textColor };
        }
    },

    'minimalist-magazine': {
        /**
         * 极简杂志 - 现代社论排版美学，让文字拥有纸质出版物的质感
         */
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 45;
            const topMargin = 100; // 为杂志页眉留出空间
            const bottomMargin = config.hasSignature ? 80 : 60;
            return {
                x: padding,
                y: topMargin,
                width: width - (padding * 2),
                height: height - topMargin - bottomMargin
            };
        },
        drawBackground: (ctx, width, height, config) => {
            // 可以在这里添加纸张纹理感（如果需要），目前保持纯色
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const textColor = config.textColor || '#1A1A1A';
            ctx.save();
            ctx.strokeStyle = CanvasUtils.hexToRgba(textColor, 0.1);
            ctx.lineWidth = 1;
            // 顶线
            ctx.beginPath();
            ctx.moveTo(rect.x, 85);
            ctx.lineTo(rect.x + rect.width, 85);
            ctx.stroke();
            // 底线
            ctx.beginPath();
            ctx.moveTo(rect.x, PREVIEW_HEIGHT - 55);
            ctx.lineTo(rect.x + rect.width, PREVIEW_HEIGHT - 55);
            ctx.stroke();
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#1A1A1A';
            const decorativeColor = '#1A1A1A'; // 固定装饰色，不随配置改变
            
            // 页眉
            ctx.save();
            ctx.fillStyle = decorativeColor;
            ctx.font = 'bold 12px "Source Han Serif SC", serif';
            ctx.textAlign = 'left';
            ctx.fillText('EDITORIAL', 45, 75);
            
            ctx.fillStyle = CanvasUtils.hexToRgba(decorativeColor, 0.6);
            ctx.font = 'italic 10px serif';
            ctx.textAlign = 'right';
            ctx.fillText('XHS-TEXTCARD // VOL. 2026', width - 45, 75);
            
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { 
                    textColor: accentColor, 
                    highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15)
                };
            }
            return { textColor };
        }
    },

    'ios-memo': {
        /**
         * 苹果备忘录 - 还原拟物感与高效记录的氛围
         */
        getContentBox: (config, width, height) => {
            const paperX = 15, paperY = 55, paperW = width - 30, paperH = height - 110;
            const internalPadding = Math.max(10, parseFloat(config.textPadding) || 20); 
            return {
                x: paperX + internalPadding,
                y: paperY + internalPadding,
                width: paperW - (internalPadding * 2),
                height: paperH - (internalPadding * 2)
            };
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const paperX = 15, paperY = 55, paperW = PREVIEW_WIDTH - 30, paperH = PREVIEW_HEIGHT - 110;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.05)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            CanvasUtils.drawRoundedRect(ctx, paperX, paperY, paperW, paperH, 12, '#ffffff');
            ctx.restore();
            
            ctx.save();
            ctx.strokeStyle = '#F2F2F7';
            ctx.lineWidth = 1;
            const lineSpacing = (parseFloat(config.fontSize) || 18) * (parseFloat(config.lineHeight) || 1.6);
            for (let y = rect.y + lineSpacing; y < rect.y + rect.height; y += lineSpacing) {
                if (y > paperY + paperH) break;
                ctx.beginPath();
                ctx.moveTo(paperX, y);
                ctx.lineTo(paperX + paperW, y);
                ctx.stroke();
            }
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#1C1C1E';
            const iosOrange = '#FF9500'; 
            ctx.save();
            ctx.fillStyle = iosOrange;
            ctx.font = '500 17px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('完成', width - 25, 35);
            ctx.textAlign = 'left';
            ctx.beginPath();
            ctx.strokeStyle = iosOrange;
            ctx.lineWidth = 2.5;
            ctx.moveTo(25, 33); ctx.lineTo(18, 26); ctx.lineTo(25, 19);
            ctx.stroke();
            ctx.fillText('备忘录', 32, 35);
            
            // 动态生成当前日期
            const now = new Date();
            const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.5); 
            ctx.font = '500 12px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(dateStr, width / 2, 35);
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF9500';
            const textColor = config.textColor || '#1C1C1E';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            }
            return { textColor };
        }
    },

    'pro-doc': {
        /**
         * 大厂文档 - 秩序、专业与权威的呈现方式
         */
        getContentBox: (config, width, height) => {
            const winX = 15, winW = width - 30, winY = 40; 
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = height - winY - winBottomMargin;
            const headerHeight = 30, gapBelowHeader = 20;
            const contentTopStart = winY + headerHeight + gapBelowHeader;
            const padding = parseFloat(config.textPadding) || 35;
            return {
                x: winX + padding,
                y: contentTopStart + (padding / 2),
                width: winW - (padding * 2),
                height: (winH - headerHeight - gapBelowHeader) - padding - (padding / 2)
            };
        },
        drawBackground: (ctx, width, height) => {
            ctx.save();
            ctx.strokeStyle = 'rgba(0,102,255,0.02)';
            ctx.lineWidth = 0.5;
            for(let i=0; i<width; i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
            for(let j=0; j<height; j+=20){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width,j); ctx.stroke(); }
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const winX = 15, winW = PREVIEW_WIDTH - 30, winY = 40;
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = PREVIEW_HEIGHT - winY - winBottomMargin;
            const headerHeight = 30, textColor = config.textColor || '#111827';

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, winH, 12, '#ffffff', true, 'rgba(0,0,0,0.05)');
            ctx.restore();

            ctx.save();
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, headerHeight, {tl: 12, tr: 12, bl: 0, br: 0}, CanvasUtils.hexToRgba(textColor, 0.05));
            const btnY = winY + headerHeight / 2;
            ctx.fillStyle = '#FF5F56'; ctx.beginPath(); ctx.arc(winX + 20, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFBD2E'; ctx.beginPath(); ctx.arc(winX + 38, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#27C93F'; ctx.beginPath(); ctx.arc(winX + 56, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.4); 
            ctx.font = '700 10px -apple-system, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('DOCUMENT VIEWER', winX + winW/2, btnY + 4);
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#6B7280';
            ctx.save();
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.6);
            ctx.font = '700 9px -apple-system, sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 25, 25);
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#0066FF', textColor = config.textColor || '#111827';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.08) };
            }
            return { textColor };
        }
    },

    'deep-night': {
        /**
         * 暗夜深思 - 赛博朋克感的深度思考空间
         */
        getContentBox: (config, width, height) => {
            const cardX = 20, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return {
                x: cardX + padding, y: cardY + padding,
                width: width - 40 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2)
            };
        },
        drawBackground: (ctx, width, height, config) => {
            const accentColor = config.accentColor || '#00F5FF';
            ctx.save();
            if (config.bgMode !== 'gradient' && (config.bgColor === '#0D0D0D' || config.bgColor === '#000000')) {
                const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
                grad.addColorStop(0, '#1a1a1a'); grad.addColorStop(1, '#050505');
                ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            }
            const lineGrad = ctx.createLinearGradient(0, 0, 0, height);
            lineGrad.addColorStop(0, 'transparent'); lineGrad.addColorStop(0.2, accentColor);
            lineGrad.addColorStop(0.8, accentColor); lineGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lineGrad; ctx.globalAlpha = 0.3; ctx.fillRect(0, 0, 3, height);
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const cardX = 20, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardW = PREVIEW_WIDTH - 40, cardH = PREVIEW_HEIGHT - cardY - cardBottomMargin;
            ctx.save();
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16, 'rgba(255,255,255,0.02)', true, 'rgba(255,255,255,0.05)');
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#E5E5E5';
            ctx.save();
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.3); ctx.font = '800 10px Inter, sans-serif'; 
            ctx.textAlign = 'right'; ctx.fillText('THOUGHT MODE ON //', width - 25, 30);
            ctx.strokeStyle = CanvasUtils.hexToRgba(textColor, 0.2); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke();
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#00F5FF', textColor = config.textColor || '#E5E5E5';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.isCode || segment.headingLevel) {
                return { 
                    textColor: accentColor, 
                    highlightColor: CanvasUtils.hexToRgba(accentColor, 0.1),
                    codeBgColor: CanvasUtils.hexToRgba(accentColor, 0.15) 
                };
            }
            return { textColor };
        },
        terminalStyles: (config) => ({ bg: '#050505', text: config.accentColor || '#00F5FF' })
    },

    'aura-gradient': {
        /**
         * 灵感弥散 - 柔和的渐变与光影效果
         */
        getContentBox: (config, width, height) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return {
                x: cardX + padding, y: cardY + padding,
                width: width - 50 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2)
            };
        },
        drawBackground: (ctx, width, height) => {
            ctx.save();
            const auras = [
                { x: 0, y: 0, r: 1, c1: 'rgba(255, 195, 160, 0.3)', c2: 'rgba(255, 195, 160, 0)' },
                { x: 1, y: 0.2, r: 0.8, c1: 'rgba(255, 175, 189, 0.25)', c2: 'rgba(255, 175, 189, 0)' },
                { x: 0.5, y: 1, r: 1.2, c1: 'rgba(33, 147, 176, 0.15)', c2: 'rgba(33, 147, 176, 0)' }
            ];
            auras.forEach(aura => {
                const grad = ctx.createRadialGradient(width * aura.x, height * aura.y, 0, width * aura.x, height * aura.y, width * aura.r);
                grad.addColorStop(0, aura.c1); grad.addColorStop(1, aura.c2);
                ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            });
            ctx.globalAlpha = 0.02;
            for (let i = 0; i < 2000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardW = PREVIEW_WIDTH - 50, cardH = PREVIEW_HEIGHT - cardY - cardBottomMargin;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.03)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, 'rgba(255, 255, 255, 0.5)', true, 'rgba(255, 255, 255, 0.4)');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1.5;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, null, true);
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#2D3436', textColor = config.textColor || '#2D3436';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            }
            return { textColor };
        },
    },

    'swiss-studio': {
        /**
         * 苏黎世工作室 - 极致的网格系统与平面秩序
         */
        getContentBox: (config, width, height) => {
             const padding = parseFloat(config.textPadding) || 35;
             const bottomOffset = config.hasSignature ? Math.max(padding, 60) : padding;
             return { x: padding, y: padding, width: width - (padding * 2), height: height - padding - bottomOffset };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.save();
            ctx.fillStyle = config.accentColor || '#FF4500'; ctx.fillRect(0, 0, 6, height);
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            ctx.save();
            ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5;
            for(let x = 0; x < PREVIEW_WIDTH; x += 40) {
                if (x < 10) continue;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PREVIEW_HEIGHT); ctx.stroke();
            }
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const accentColor = config.accentColor || '#FF4500', textColor = config.textColor || '#1A1A1A';
            ctx.save();
            ctx.fillStyle = textColor; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right';
            ctx.fillText('REF. CH-8004', width - 25, 25);
            ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF4500', textColor = config.textColor || '#1A1A1A';
            if (segment.headingLevel || segment.fontWeight === '700' || segment.fontWeight === '800') {
                return { textColor: accentColor };
            }
            if (segment.isHighlight) {
                return { highlightColor: accentColor, textColor: '#FFFFFF' };
            }
            return { textColor };
        },
    },

    /**
     * 获取内容区域的精确位置和大小
     * 这是布局的唯一真理来源，TextSplitter 和 CanvasRenderer 必须都使用此方法
     */
    getContentBox: (templateId, config, width, height) => {
        // 优先使用模板自定义的 getContentBox
        if (TemplateDefinitions[templateId] && TemplateDefinitions[templateId].getContentBox) {
            return TemplateDefinitions[templateId].getContentBox(config, width, height);
        }

        const padding = parseFloat(config.textPadding) || 35;
        let topOffset = padding;
        
        // 底部预留空间 (比如签名栏)
        let bottomOffset = padding;
        if (config.hasSignature) {
            bottomOffset = Math.max(padding, 60); // 签名栏至少需要60px
        }

        return {
            x: padding,
            y: topOffset,
            width: width - (padding * 2),
            height: height - topOffset - bottomOffset
        };
    }
};
