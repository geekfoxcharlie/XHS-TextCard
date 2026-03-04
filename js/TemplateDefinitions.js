/**
 * TemplateDefinitions
 * 定义每个模板特有的 Canvas 绘制逻辑和布局参数
 */
const TemplateDefinitions = {
    /**
     * 内部页码绘制辅助工具
     */
    _drawPageNumber: (ctx, width, height, index, totalCount, config, options = {}) => {
        if (!config.showPageNumber) return;
        
        const pageNum = config.hasCover ? index : index + 1;
        const totalPage = config.hasCover ? totalCount - 1 : totalCount;
        if (totalPage <= 0) return;

        const {
            color = 'rgba(128, 128, 128, 0.5)',
            font = '500 12px sans-serif',
            textAlign = 'right',
            x = width - 25,
            y = height - 25,
            prefix = '',
            suffix = '',
            padZero = false
        } = options;

        ctx.save();
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = textAlign;
        
        const format = (n) => padZero ? String(n).padStart(2, '0') : n;
        const text = `${prefix}${format(pageNum)} / ${format(totalPage)}${suffix}`;
        
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    /**
     * 噪点纹理缓存
     */
    _noiseTextureCache: new Map(),

    /**
     * 生成噪点纹理
     */
    _getNoiseTexture: (width, height) => {
        const key = `${width}x${height}`;
        if (TemplateDefinitions._noiseTextureCache.has(key)) {
            return TemplateDefinitions._noiseTextureCache.get(key);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const tCtx = canvas.getContext('2d');
        tCtx.globalAlpha = 0.04;
        for (let i = 0; i < 5000; i++) {
            tCtx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
            tCtx.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
        }
        TemplateDefinitions._noiseTextureCache.set(key, canvas);
        return canvas;
    },

    /**
     * 纸张纹理缓存
     */
    _paperTextureCache: new Map(),

    /**
     * 生成纸张纹理 (深度优化版：包含噪点、长纤维、以及随机纸浆感)
     */
    _getPaperTexture: (width, height) => {
        const key = `${width}x${height}`;
        if (TemplateDefinitions._paperTextureCache.has(key)) {
            return TemplateDefinitions._paperTextureCache.get(key);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const tCtx = canvas.getContext('2d');

        // 1. 基础极细噪点 (Simulating paper grain)
        tCtx.globalAlpha = 0.06;
        for (let i = 0; i < 8000; i++) {
            const size = Math.random() * 1.5;
            tCtx.fillStyle = Math.random() > 0.5 ? '#8b4513' : '#000';
            tCtx.fillRect(Math.random() * width, Math.random() * height, size, size);
        }
        
        // 2. 模拟随机纸浆团 (Paper pulp / blotches)
        tCtx.globalAlpha = 0.02;
        for (let i = 0; i < 40; i++) {
            const bx = Math.random() * width;
            const by = Math.random() * height;
            const br = 10 + Math.random() * 50;
            const grad = tCtx.createRadialGradient(bx, by, 0, bx, by, br);
            grad.addColorStop(0, '#8b4513');
            grad.addColorStop(1, 'transparent');
            tCtx.fillStyle = grad;
            tCtx.beginPath();
            tCtx.arc(bx, by, br, 0, Math.PI * 2);
            tCtx.fill();
        }

        // 3. 模拟长纤维 (Fine fibers)
        tCtx.globalAlpha = 0.04;
        tCtx.strokeStyle = '#5d4037';
        tCtx.lineWidth = 0.4;
        for (let i = 0; i < 200; i++) {
            const lx = Math.random() * width;
            const ly = Math.random() * height;
            const len = 4 + Math.random() * 12;
            const angle = Math.random() * Math.PI * 2;
            // 绘制稍微弯曲的纤维
            tCtx.beginPath();
            tCtx.moveTo(lx, ly);
            const cp1x = lx + Math.cos(angle) * (len / 3);
            const cp1y = ly + Math.sin(angle) * (len / 3) + (Math.random() * 2 - 1);
            tCtx.quadraticCurveTo(cp1x, cp1y, lx + Math.cos(angle) * len, ly + Math.sin(angle) * len);
            tCtx.stroke();
        }

        TemplateDefinitions._paperTextureCache.set(key, canvas);
        return canvas;
    },

    'blank': {
        /**
         * 空白模板 - 极致简约
         */
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            }
            return { textColor };
        }
    },

    'polaroid': {
        /**
         * 复古拍立得 - 相纸留白与复古手写感
         */
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 60;
            const marginX = 50, marginY = 60;
            const bottomBlankHeight = 450;
            const photoHeight = height - (marginY * 2) - bottomBlankHeight;
            
            return {
                x: marginX + padding,
                y: marginY + photoHeight + 40,
                width: width - (marginX * 2) - (padding * 2),
                height: bottomBlankHeight - 40 - (config.hasSignature ? 80 : 40)
            };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.save();
            // 只有在非渐变模式下才填充底色，渐变色由渲染器预先绘制
            if (config.bgMode !== 'gradient') {
                ctx.fillStyle = config.bgColor || '#D6D6D6';
                ctx.fillRect(0, 0, width, height);
            }
            
            // 绘制缓存的复古噪点纹理
            const noise = TemplateDefinitions._getNoiseTexture(width, height);
            ctx.drawImage(noise, 0, 0);
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const marginX = 50, marginY = 60;
            const paperWidth = PREVIEW_WIDTH - (marginX * 2);
            const paperHeight = PREVIEW_HEIGHT - (marginY * 2);
            
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 30; ctx.shadowOffsetY = 15;
            CanvasUtils.drawRoundedRect(ctx, marginX, marginY, paperWidth, paperHeight, 4, '#FAFAFA');
            ctx.shadowColor = 'transparent';
            
            const photoMargin = 30;
            const photoWidth = paperWidth - (photoMargin * 2);
            const photoHeight = paperHeight - 450;
            
            ctx.fillStyle = '#2C2C2C';
            ctx.fillRect(marginX + photoMargin, marginY + photoMargin, photoWidth, photoHeight);
            
            const grad = ctx.createLinearGradient(marginX + photoMargin, marginY + photoMargin, marginX + photoMargin + photoWidth, marginY + photoMargin + photoHeight);
            grad.addColorStop(0, 'rgba(255,255,255,0.1)'); grad.addColorStop(0.3, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(marginX + photoMargin, marginY + photoMargin, photoWidth, photoHeight);
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            // 胶带
            ctx.save();
            ctx.translate(width / 2, 45); ctx.rotate(-0.05);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
            ctx.fillRect(-80, -20, 160, 40);
            ctx.restore();

            // 页码：放在右下角留白处
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                x: width - 75, y: height - 85, color: 'rgba(0,0,0,0.3)', font: 'italic 14px serif', padZero: true
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#D9534F';
            const textColor = config.textColor || '#2B2B2B';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.headingLevel) return { textColor: accentColor };
            if (segment.isHighlight) return { textColor: textColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            return { textColor };
        }
    },

    'notion-style': {
        /**
         * 效率笔记 (Notion风)
         */
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 40;
            const topMargin = 120, bottomMargin = config.hasSignature ? 80 : 50;
            return { x: padding, y: topMargin, width: width - (padding * 2), height: height - topMargin - bottomMargin };
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const padding = parseFloat(config.textPadding) || 40;
            ctx.save();
            ctx.font = '14px ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            
            // 使用固定的 Notion 灰 (#9B9A97)，不受用户修改的正文颜色影响
            const fixedMutedColor = '#9B9A97';
            const fixedLineColor = 'rgba(55, 53, 47, 0.08)';

            ctx.fillStyle = '#37352F'; // 图标保持深灰
            ctx.fillText('📖', padding, 60);
            
            ctx.fillStyle = fixedMutedColor;
            ctx.fillText(' /  Workspace  /  Notes', padding + 25, 60);
            
            ctx.strokeStyle = fixedLineColor;
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padding, 90); ctx.lineTo(width - padding, 90); ctx.stroke();
            ctx.restore();
            
            // 页码也使用固定颜色
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                color: 'rgba(155, 154, 151, 0.7)'
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#0F7B6C';
            const textColor = config.textColor || '#37352F';
            if (segment.isHighlight) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.headingLevel) return { textColor: accentColor };
            return { textColor };
        }
    },

    'elegant-book': {
        /**
         * 书籍内页 - 模拟真实的单页书籍装帧感
         * 设计要点：左侧装订阴影（Gutter），单侧受光，极简边角排版
         */
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 55;
            const topMargin = 130; 
            const bottomMargin = config.hasSignature ? 110 : 90;
            // 增加左侧边距以避开装订阴影区
            return { x: padding + 10, y: topMargin, width: width - (padding * 2) - 10, height: height - topMargin - bottomMargin };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.save();
            
            // 1. 基础纸张色 - 严格水平单侧受光模拟
            // 模拟主光源从右侧射入，纸张从右向左由于远离光源而产生的极其微弱的亮度衰减
            const baseGrad = ctx.createLinearGradient(width, 0, 0, 0);
            const bgColor = config.bgColor || '#FDFBF7';
            baseGrad.addColorStop(0, bgColor); // 右侧最亮（原始纸张色）
            baseGrad.addColorStop(1, CanvasUtils.hexToRgba(bgColor, 0.96)); // 左侧微暗
            ctx.fillStyle = baseGrad;
            ctx.fillRect(0, 0, width, height);
            
            // 2. 绘制离屏缓存的高级纸张纹理
            const texture = TemplateDefinitions._getPaperTexture(width, height);
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(texture, 0, 0);

            // 3. 【美学重构】极致单侧装订阴影 (Left Gutter Only)
            // 彻底移除任何右侧阴影逻辑
            ctx.globalCompositeOperation = 'source-over';
            const gutterGrad = ctx.createLinearGradient(0, 0, width * 0.12, 0);
            gutterGrad.addColorStop(0, 'rgba(0,0,0,0.15)'); // 书脊折痕最深处
            gutterGrad.addColorStop(0.3, 'rgba(0,0,0,0.06)');
            gutterGrad.addColorStop(0.7, 'rgba(0,0,0,0.01)');
            gutterGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gutterGrad;
            ctx.fillRect(0, 0, width * 0.12, height);

            // 4. 纸张右边缘的高光切面 (Edge Highlight)
            // 模拟纸张厚度在受光面产生的微弱高光，增强物理真实感
            const edgeReflect = ctx.createLinearGradient(width - 3, 0, width, 0);
            edgeReflect.addColorStop(0, 'rgba(255,255,255,0)');
            edgeReflect.addColorStop(1, 'rgba(255,255,255,0.4)');
            ctx.fillStyle = edgeReflect;
            ctx.fillRect(width - 3, 0, 3, height);
            
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const padding = parseFloat(config.textPadding) || 55;
            ctx.save();
            
            // 使用固定的古典墨色
            const fixedMutedInk = 'rgba(93, 64, 55, 0.4)';
            const fixedLineColor = 'rgba(93, 64, 55, 0.12)';
            
            // 顶部装饰
            ctx.strokeStyle = fixedLineColor;
            ctx.lineWidth = 0.8; 
            ctx.beginPath(); 
            ctx.moveTo(padding + 10, 80); 
            ctx.lineTo(width - padding, 80); 
            ctx.stroke();
            
            ctx.fillStyle = fixedMutedInk;
            ctx.font = 'italic 500 11px "Noto Serif SC", serif';
            ctx.textAlign = 'center'; 
            ctx.fillText('C L A S S I C   L I T E R A T U R E', width / 2 + 5, 65);
            
            ctx.fillStyle = '#5D4037';
            ctx.font = '16px serif';
            ctx.fillText('§', padding + 10, 68);

            // 页码：使用统一的物理边角定位
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                color: fixedMutedInk,
                font: '500 12px "Noto Serif SC", serif',
                prefix: 'P. ',
                padZero: true
            });
            ctx.restore();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#8C3A3A';
            const textColor = config.textColor || '#2B2B2B';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.headingLevel) return { textColor: accentColor };
            if (segment.isHighlight) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.1) };
            return { textColor };
        }
    },

    'ios-memo': {
        getContentBox: (config, width, height) => {
            const paperX = 15, paperY = 55, paperW = width - 30, paperH = height - 110;
            const internalPadding = Math.max(10, parseFloat(config.textPadding) || 20); 
            return { x: paperX + internalPadding, y: paperY + internalPadding, width: paperW - (internalPadding * 2), height: paperH - (internalPadding * 2) };
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const paperX = 15, paperY = 55, paperW = PREVIEW_WIDTH - 30, paperH = PREVIEW_HEIGHT - 110;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5;
            CanvasUtils.drawRoundedRect(ctx, paperX, paperY, paperW, paperH, 12, '#ffffff');
            ctx.restore();
            ctx.save(); ctx.strokeStyle = '#F2F2F7'; ctx.lineWidth = 1;
            const lineSpacing = (parseFloat(config.fontSize) || 18) * (parseFloat(config.lineHeight) || 1.6);
            for (let y = rect.y + lineSpacing; y < rect.y + rect.height; y += lineSpacing) {
                if (y > paperY + paperH) break;
                ctx.beginPath(); ctx.moveTo(paperX, y); ctx.lineTo(paperX + paperW, y); ctx.stroke();
            }
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const iosOrange = '#FF9500'; 
            ctx.save();
            ctx.fillStyle = iosOrange; ctx.font = '500 17px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('完成', width - 25, 35); ctx.textAlign = 'left';
            ctx.beginPath(); ctx.strokeStyle = iosOrange; ctx.lineWidth = 2.5; ctx.moveTo(25, 33); ctx.lineTo(18, 26); ctx.lineTo(25, 19); ctx.stroke();
            ctx.fillText('备忘录', 32, 35);
            const now = new Date();
            const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            ctx.fillStyle = '#8E8E93'; ctx.font = '500 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(dateStr, width / 2, 35);
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, { x: width - 25, y: height - 25 });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF9500', textColor = config.textColor || '#1C1C1E';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            }
            return { textColor };
        }
    },

    'swiss-studio': {
        getContentBox: (config, width, height) => {
             const padding = parseFloat(config.textPadding) || 35;
             const bottomOffset = config.hasSignature ? Math.max(padding, 60) : padding;
             return { x: padding, y: padding, width: width - (padding * 2), height: height - padding - bottomOffset };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.save(); ctx.fillStyle = config.accentColor || '#FF4500'; ctx.fillRect(0, 0, 6, height); ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5;
            for(let x = 0; x < PREVIEW_WIDTH; x += 40) {
                if (x < 10) continue;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PREVIEW_HEIGHT); ctx.stroke();
            }
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const accentColor = config.accentColor || '#FF4500', decorativeColor = '#1A1A1A';
            ctx.save();
            ctx.fillStyle = decorativeColor; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right';
            ctx.fillText('REF. CH-8004', width - 25, 25);
            ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, {
                color: '#1A1A1A', font: '700 10px Helvetica', padZero: true, textAlign: 'left', x: 25, y: height - 25
            });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF4500', textColor = config.textColor || '#1A1A1A';
            if (segment.headingLevel || segment.fontWeight === '700' || segment.fontWeight === '800') return { textColor: accentColor };
            if (segment.isHighlight) return { highlightColor: accentColor, textColor: '#FFFFFF' };
            return { textColor };
        }
    },

    'minimalist-magazine': {
        getContentBox: (config, width, height) => {
            const padding = parseFloat(config.textPadding) || 45;
            const topMargin = 100, bottomMargin = config.hasSignature ? 80 : 60;
            return { x: padding, y: topMargin, width: width - (padding * 2), height: height - topMargin - bottomMargin };
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const textColor = config.textColor || '#1A1A1A';
            ctx.save();
            ctx.strokeStyle = CanvasUtils.hexToRgba(textColor, 0.1);
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rect.x, 85); ctx.lineTo(rect.x + rect.width, 85); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rect.x, PREVIEW_HEIGHT - 55); ctx.lineTo(rect.x + rect.width, PREVIEW_HEIGHT - 55); ctx.stroke();
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const decorativeColor = '#1A1A1A';
            ctx.save();
            ctx.fillStyle = decorativeColor; ctx.font = 'bold 12px serif';
            ctx.textAlign = 'left'; ctx.fillText('EDITORIAL', 45, 75);
            ctx.fillStyle = CanvasUtils.hexToRgba(decorativeColor, 0.6); ctx.font = 'italic 10px serif';
            ctx.textAlign = 'right'; ctx.fillText('COLLECTION // VOL. 2026', width - 45, 75);
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, { x: width - 45, y: height - 35 });
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            }
            return { textColor };
        }
    },

    'aura-gradient': {
        getContentBox: (config, width, height) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return { x: cardX + padding, y: cardY + padding, width: width - 50 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2) };
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
            
            // 绘制缓存的噪点纹理
            const noise = TemplateDefinitions._getNoiseTexture(width, height);
            ctx.drawImage(noise, 0, 0);
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardW = PREVIEW_WIDTH - 50, cardH = PREVIEW_HEIGHT - cardY - cardBottomMargin;
            ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.03)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, 'rgba(255, 255, 255, 0.5)', true, 'rgba(255, 255, 255, 0.4)');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1.5;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, null, true);
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#2D3436', textColor = config.textColor || '#2D3436';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            return { textColor };
        }
    },

    'deep-night': {
        getContentBox: (config, width, height) => {
            const cardX = 20, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return { x: cardX + padding, y: cardY + padding, width: width - 40 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2) };
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
            ctx.save(); ctx.fillStyle = 'rgba(229, 229, 229, 0.3)'; ctx.font = '800 10px Inter, sans-serif'; 
            ctx.textAlign = 'right'; ctx.fillText('// THOUGHT MODE ON', width - 25, 25);
            ctx.strokeStyle = 'rgba(229, 229, 229, 0.2)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke();
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config, { color: 'rgba(255, 255, 255, 0.3)', textAlign: 'left', x: 25, y: 25 });
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
        }
    },

    'pro-doc': {
        getContentBox: (config, width, height) => {
            const winX = 15, winW = width - 30, winY = 40; 
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = height - winY - winBottomMargin;
            const headerHeight = 30, gapBelowHeader = 20;
            const padding = parseFloat(config.textPadding) || 35;
            return { x: winX + padding, y: winY + headerHeight + gapBelowHeader + (padding / 2), width: winW - (padding * 2), height: (winH - headerHeight - gapBelowHeader) - padding };
        },
        drawBackground: (ctx, width, height) => {
            ctx.save(); ctx.strokeStyle = 'rgba(0,102,255,0.02)'; ctx.lineWidth = 0.5;
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
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.4); ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('DOCUMENT VIEWER', winX + winW/2, btnY + 4);
            ctx.restore();
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            ctx.save(); ctx.fillStyle = '#6B7280'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 25, 25);
            ctx.restore();
            TemplateDefinitions._drawPageNumber(ctx, width, height, index, totalCount, config);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#0066FF', textColor = config.textColor || '#111827';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.08) };
            return { textColor };
        }
    },

    getContentBox: (templateId, config, width, height) => {
        if (TemplateDefinitions[templateId] && TemplateDefinitions[templateId].getContentBox) {
            return TemplateDefinitions[templateId].getContentBox(config, width, height);
        }
        const padding = parseFloat(config.textPadding) || 35;
        let topOffset = padding;
        let bottomOffset = padding;
        if (config.hasSignature) {
            bottomOffset = Math.max(padding, 60);
        }
        return {
            x: padding,
            y: topOffset,
            width: width - (padding * 2),
            height: height - topOffset - bottomOffset
        };
    }
};
