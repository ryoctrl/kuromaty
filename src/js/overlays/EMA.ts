import { BarColumn, ColorOption } from "../kuromaty";
import { Chart } from "../kuromaty";
import { ChartDimensions, Overlay } from "../Overlay";
import assign from "object.assign";

export class EMA implements Overlay {
    minPeriod: number = 1;

    get requiredBackCount(): number {
        return Math.round((this.options.period + 1) * 3.45);
    }

    options = {
        period: 20,
        colorKey: "lineMA1"
    };

    constructor(options: Options = {}) {
        assign(this.options, options);
    }

    draw(chart: Chart, dimensions: ChartDimensions, colors: ColorOption) {

        const ctx = chart.context;
        const barX = dimensions.width - dimensions.rightMargin - Math.ceil(dimensions.barWidth / 2) + 0.5 /* hige width */;
        const barW = dimensions.barMargin + dimensions.barWidth;
        const barCount = dimensions.barCount;
        const ema = this.calculateEMA(chart, barCount);

        if (ema.length === 0) {
            return;
        }

        ctx.save();

        ctx.strokeStyle = colors[this.options.colorKey];
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(barX, pointToY(ema[0]));
        const emaLength = Math.min(ema.length, barCount);
        for (let i = 1, x = barX; i < emaLength; i++) {
            x -= barW;
            ctx.lineTo(x, pointToY(ema[i]));
        }

        ctx.stroke();
        ctx.restore();

        function pointToY(price: number) {
            return Math.round((chart.highest - price) * chart.ratio) + 0.5;
        }
    }

    private calculateEMA(chart: Chart, barCount) {

        const ema: number[] = [];
        const period = this.options.period;
        const bars = chart._bars;
        const maxIndex = Math.min(bars.length - period, barCount + this.requiredBackCount);

        if (bars.length < period) {
            return [];
        }

        let mean;

        {
            // 初期値を計算
            let sum = 0;
            for (let i = 0; i < period; i++) {
                sum += bars[maxIndex + i][BarColumn.Close];
            }
            mean = sum / period;
        }
        ema.unshift(mean);

        const weight = 2 / (period + 1);
        const weight2 = 1 - weight;
        for (let i = maxIndex - 1; i >= 0; i--) {
            mean = weight * bars[i][BarColumn.Close] + weight2 * mean;
            ema.unshift(mean);
        }

        return ema;
    }
}

export interface Config {
    period: number;
    colorKey: string;
}

export type Options = Partial<Config>;
