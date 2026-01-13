/**
 * TextMeasurer
 * 文本测量器 - 在固定文字区域中精确计算文本元素大小
 * 保证算法稳定性：不依赖外部CSS变量，使用内联样式完全控制测量环境
 * @version 1.0
 */
class TextMeasurer {
    constructor(textConfig) {
        this.textConfig = { ...textConfig };

        this.TEXT_AREA_WIDTH = TEXT_AREA_WIDTH;
        this.TEXT_AREA_HEIGHT = TEXT_AREA_HEIGHT;
        this.SAFETY_MARGIN = SAFETY_MARGIN;
        this.MAX_CONTENT_HEIGHT = this.TEXT_AREA_HEIGHT - this.SAFETY_MARGIN;

        this.measureElement = null;
        this.wrapper = null;

        this._initMeasureElement();
    }

    _initMeasureElement() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.cssText = `
            position: absolute;
            visibility: hidden;
            left: -9999px;
            top: 0;
            width: ${PREVIEW_WIDTH}px;
            height: ${PREVIEW_HEIGHT}px;
        `;

        this.measureElement = document.createElement('div');
        this.measureElement.className = 'text-layer';
        this.measureElement.style.cssText = `
            width: ${this.TEXT_AREA_WIDTH}px;
            height: auto;
            max-height: none;
            box-sizing: border-box;
            overflow: hidden;
            padding: ${this.textConfig.textPadding}px;
            font-size: ${this.textConfig.fontSize}px;
            line-height: ${this.textConfig.lineHeight};
            letter-spacing: ${this.textConfig.letterSpacing}px;
            font-family: ${this.textConfig.fontFamily};
            color: #333333;
        `;

        this.wrapper.appendChild(this.measureElement);
        document.body.appendChild(this.wrapper);
    }

    updateConfig(textConfig) {
        this.textConfig = { ...textConfig };
        this.measureElement.style.padding = this.textConfig.textPadding + 'px';
        this.measureElement.style.fontSize = this.textConfig.fontSize + 'px';
        this.measureElement.style.lineHeight = this.textConfig.lineHeight;
        this.measureElement.style.letterSpacing = this.textConfig.letterSpacing + 'px';
        this.measureElement.style.fontFamily = this.textConfig.fontFamily;
    }

    measure(html) {
        this.measureElement.innerHTML = html;
        const height = this.measureElement.scrollHeight;
        const rect = this.measureElement.getBoundingClientRect();
        const actualHeight = Math.max(height, rect.height);

        return {
            height: actualHeight,
            exceedsMax: actualHeight > this.MAX_CONTENT_HEIGHT,
            scrollHeight: height,
            rectHeight: rect.height
        };
    }

    canFit(html) {
        const result = this.measure(html);
        return !result.exceedsMax;
    }

    measureWithValidation(html) {
        const result = this.measure(html);
        if (result.exceedsMax) {
            console.debug(`[TextMeasurer] Content exceeds max height: ${result.height} > ${this.MAX_CONTENT_HEIGHT}`);
        }
        return result;
    }

    getMaxHeight() {
        return this.MAX_CONTENT_HEIGHT;
    }

    getTextAreaSize() {
        return {
            width: this.TEXT_AREA_WIDTH,
            height: this.TEXT_AREA_HEIGHT,
            maxContentHeight: this.MAX_CONTENT_HEIGHT
        };
    }

    destroy() {
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
        this.wrapper = null;
        this.measureElement = null;
    }
}
