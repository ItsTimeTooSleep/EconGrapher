'use client'

import { TrendingUp, BarChart3, Info } from 'lucide-react'
import type { EffectAnalysis } from '@/lib/types'

const CHANGE_TYPE_LABELS: Record<string, string> = {
  supply_increase: 'Supply Increase',
  supply_decrease: 'Supply Decrease',
  demand_increase: 'Demand Increase',
  demand_decrease: 'Demand Decrease',
  expansionary_monetary_policy: 'Expansionary Monetary Policy',
  contractionary_monetary_policy: 'Contractionary Monetary Policy',
  expansionary_fiscal_policy: 'Expansionary Fiscal Policy',
  contractionary_fiscal_policy: 'Contractionary Fiscal Policy',
  ad_increase: 'AD Increase',
  ad_decrease: 'AD Decrease',
  sras_decrease: 'SRAS Decrease (Supply Shock)',
  profit_maximization: 'Profit Maximization Analysis'
}

const MARKET_LABELS: Record<string, string> = {
  goods_market: 'Goods Market',
  money_market: 'Money Market',
  loanable_funds_market: 'Loanable Funds Market',
  labor_market: 'Labor Market',
  factor_market: 'Factor Market',
  macroeconomy: 'Macroeconomy (AD-AS)',
  firm_market: 'Firm / Industry Analysis'
}

interface Props {
  analysis: EffectAnalysis
}

export default function AnalysisCard({ analysis }: Props) {
  const changeLabel = CHANGE_TYPE_LABELS[analysis.changeType] || analysis.changeType.replace(/_/g, ' ')
  const marketLabel = MARKET_LABELS[analysis.market] || analysis.market.replace(/_/g, ' ')

  const impacts = analysis.impact.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div className="rounded-lg border border-analysis-card-border bg-analysis-card-bg p-4 mt-2 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/20">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{changeLabel}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {marketLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">Key Effects</p>
          <ul className="flex flex-col gap-1">
            {impacts.map((impact, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span className="capitalize leading-relaxed">{impact}</span>
              </li>
            ))}
          </ul>
        </div>

        {analysis.additionalNotes && (
          <div className="border-t border-analysis-card-border pt-2 mt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Info className="w-3 h-3" /> Additional Notes
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.additionalNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
