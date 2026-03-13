declare module 'plotly.js-dist-min' {
  interface PlotlyStatic {
    newPlot(
      root: string | HTMLElement,
      data: unknown[],
      layout?: unknown,
      config?: unknown
    ): Promise<void>
    purge(root: string | HTMLElement): void
    react(
      root: string | HTMLElement,
      data: unknown[],
      layout?: unknown,
      config?: unknown
    ): Promise<void>
    restyle(
      root: string | HTMLElement,
      update: unknown,
      traces?: number | number[]
    ): Promise<void>
    relayout(root: string | HTMLElement, update: unknown): Promise<void>
  }

  const Plotly: PlotlyStatic
  export = Plotly
}
