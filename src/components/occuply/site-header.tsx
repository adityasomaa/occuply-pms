import * as React from "react"

import { PageHeading } from "@/components/occuply/page-heading"

/** Section pages reuse the dashboard's heading block so the whole app shares
 *  one open, bar-free layout. `today` is accepted for call-site symmetry. */
export function SiteHeader(props: {
  title: string
  subtitle?: string
  today?: string
  alerts?: number
  children?: React.ReactNode
}) {
  return (
    <PageHeading title={props.title} subtitle={props.subtitle} alerts={props.alerts}>
      {props.children}
    </PageHeading>
  )
}
