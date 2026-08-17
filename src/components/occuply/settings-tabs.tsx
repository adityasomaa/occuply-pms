"use client"

import * as React from "react"
import { toast } from "sonner"
import { MailPlusIcon, ShieldCheckIcon } from "lucide-react"

import { Panel, StatusDot } from "@/components/occuply/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { timeOfDay, shortDate } from "@/lib/format"
import type { Property, StaffMember } from "@/lib/types"
import { cn } from "@/lib/utils"

const accessTone: Record<StaffMember["accessLevel"], string> = {
  Owner: "border-accent/35 bg-accent-soft text-accent-brand",
  Manager: "border-status-info/30 bg-status-info/10 text-status-info",
  Supervisor: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  Staff: "border-border bg-muted text-muted-foreground",
  "Read only": "border-border bg-muted text-muted-foreground",
}

const NOTIFICATIONS = [
  {
    id: "arrivals",
    label: "Daily arrivals digest",
    description: "Sent at 07:00 local time with today's arrivals, departures and room blocks.",
    on: true,
  },
  {
    id: "channel",
    label: "Channel sync failures",
    description: "Immediate alert when a channel rejects a rate or availability push.",
    on: true,
  },
  {
    id: "pricing",
    label: "Pricing recommendations",
    description: "A summary of rate changes the engine wants to make, before they apply.",
    on: true,
  },
  {
    id: "maintenance",
    label: "Critical maintenance",
    description: "Raised the moment a ticket is logged as critical or blocks a sellable room.",
    on: true,
  },
  {
    id: "cancellations",
    label: "High-value cancellations",
    description: "Triggered when a booking above Rp10.000.000 is cancelled.",
    on: false,
  },
  {
    id: "weekly",
    label: "Weekly performance report",
    description: "Occupancy, ADR and RevPAR against the same week last year, sent Monday morning.",
    on: true,
  },
]

export function SettingsTabs({
  user,
  staff,
  property,
  initialTab,
}: {
  user: StaffMember
  staff: StaffMember[]
  property: Property
  initialTab: string
}) {
  const [team, setTeam] = React.useState(() => Object.fromEntries(staff.map((s) => [s.id, s.active])))
  const [notifs, setNotifs] = React.useState(() =>
    Object.fromEntries(NOTIFICATIONS.map((n) => [n.id, n.on])),
  )

  return (
    <Tabs defaultValue={initialTab} className="gap-4">
      <TabsList className="w-full justify-start overflow-x-auto scroll-slim">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="team">Team &amp; access</TabsTrigger>
        <TabsTrigger value="property">Property</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      {/* ------------------------------ profile ------------------------------ */}
      <TabsContent value="profile" className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Your profile" description="How you appear to the rest of the team">
          <form
            className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:px-5"
            onSubmit={(e) => {
              e.preventDefault()
              toast.success("Profile saved")
            }}
          >
            <Field id="name" label="Full name" defaultValue={user.name} />
            <Field id="role" label="Job title" defaultValue={user.role} />
            <Field id="email" label="Work email" type="email" defaultValue={user.email} />
            <Field id="phone" label="Mobile" defaultValue={user.phone} help="Used for critical alerts by SMS." />

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bio" className="text-xs font-medium">
                Handover note
              </Label>
              <Textarea
                id="bio"
                rows={3}
                className="text-sm"
                defaultValue="Covering the morning shift Monday to Friday. Escalate rate decisions above 20% to the revenue manager before pushing."
              />
              <p className="text-xs text-muted-foreground">
                Shown to colleagues on the shift handover screen.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" size="sm" className="h-8 bg-accent text-accent-foreground hover:bg-accent/90">
                Save changes
              </Button>
              <Button type="reset" variant="ghost" size="sm" className="h-8">
                Discard
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Security" description="Protecting the property's data">
          <ul className="divide-y divide-border">
            <li className="flex items-start gap-3 px-4 py-3.5 lg:px-5">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-status-ok" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">
                  Enabled with an authenticator app on 12 May 2026.
                </p>
              </div>
              <Badge variant="outline" className="border-status-ok/30 bg-status-ok/10 text-status-ok">
                On
              </Badge>
            </li>
            <li className="space-y-1 px-4 py-3.5 lg:px-5">
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">Last changed 94 days ago.</p>
              <Button variant="outline" size="sm" className="mt-1 h-7 text-xs">
                Change password
              </Button>
            </li>
            <li className="space-y-1 px-4 py-3.5 lg:px-5">
              <p className="text-sm font-medium">Active sessions</p>
              <p className="text-xs text-muted-foreground">
                Two devices signed in: Chrome on Windows and Safari on iPhone.
              </p>
              <Button variant="ghost" size="sm" className="mt-1 h-7 px-0 text-xs text-destructive hover:text-destructive">
                Sign out everywhere else
              </Button>
            </li>
          </ul>
        </Panel>
      </TabsContent>

      {/* -------------------------------- team ------------------------------- */}
      <TabsContent value="team">
        <Panel
          title="Team and access"
          description={`${Object.values(team).filter(Boolean).length} of ${staff.length} accounts active`}
          action={
            <Button
              size="sm"
              className="h-7 gap-1.5 bg-accent text-xs text-accent-foreground hover:bg-accent/90"
              onClick={() => toast.success("Invitation sent", { description: "The invite expires in seven days." })}
            >
              <MailPlusIcon className="size-3" strokeWidth={2.25} />
              Invite
            </Button>
          }
          bodyClassName="overflow-x-auto scroll-slim"
        >
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Person", "Department", "Access level", "Contact", "Last active", "Enabled"].map((h) => (
                  <th key={h} className="label-brand px-4 py-2 font-medium lg:px-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((s) => (
                <tr
                  key={s.id}
                  className={cn(
                    "ease-occuply transition-colors hover:bg-muted/50",
                    !team[s.id] && "opacity-55",
                  )}
                >
                  <td className="px-4 py-3 lg:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-[0.625rem] font-semibold text-background">
                        {s.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground lg:px-5">{s.department}</td>
                  <td className="px-4 py-3 lg:px-5">
                    <Badge variant="outline" className={accessTone[s.accessLevel]}>
                      {s.accessLevel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 lg:px-5">
                    <p className="truncate text-xs">{s.email}</p>
                    <p className="num truncate text-xs text-muted-foreground">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3 lg:px-5">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <StatusDot tone={team[s.id] ? "ok" : "idle"} className="size-1.5" />
                      {shortDate(s.lastActive)} · {timeOfDay(s.lastActive)}
                    </span>
                  </td>
                  <td className="px-4 py-3 lg:px-5">
                    <Switch
                      checked={team[s.id]}
                      onCheckedChange={(v) => {
                        setTeam((t) => ({ ...t, [s.id]: v }))
                        toast[v ? "success" : "message"](
                          v ? `${s.name} can sign in again` : `${s.name} suspended`,
                        )
                      }}
                      aria-label={`${team[s.id] ? "Suspend" : "Reactivate"} ${s.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </TabsContent>

      {/* ------------------------------ property ----------------------------- */}
      <TabsContent value="property" className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Property settings" description={property.name}>
          <form
            className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:px-5"
            onSubmit={(e) => {
              e.preventDefault()
              toast.success("Property settings saved")
            }}
          >
            <Field id="propname" label="Property name" defaultValue={property.name} />
            <Field id="proptype" label="Property type" defaultValue={property.type} />
            <Field id="checkin" label="Check-in time" defaultValue={property.checkIn} />
            <Field id="checkout" label="Check-out time" defaultValue={property.checkOut} />
            <Field id="currency" label="Currency" defaultValue="IDR — Indonesian Rupiah" />
            <Field id="tz" label="Timezone" defaultValue={property.timezone} />
            <Field id="tax" label="Tax and service" defaultValue="21% (11% tax, 10% service)" help="Applied on top of every published rate." />
            <Field id="units" label="Sellable units" defaultValue={String(property.totalUnits)} />

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="policy" className="text-xs font-medium">
                Cancellation policy
              </Label>
              <Textarea
                id="policy"
                rows={3}
                className="text-sm"
                defaultValue="Free cancellation until 48 hours before arrival. Inside 48 hours the first night is charged. No-shows are charged the full stay."
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="sm" className="h-8 bg-accent text-accent-foreground hover:bg-accent/90">
                Save property
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Danger zone" description="Actions that cannot be undone">
          <div className="space-y-3 px-4 py-4 lg:px-5">
            <div className="space-y-1">
              <p className="text-sm font-medium">Stop selling this property</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Withdraws availability from every connected channel. Existing reservations are kept and
                can still be checked in.
              </p>
              <Button variant="outline" size="sm" className="mt-1 h-7 text-xs">
                Pause distribution
              </Button>
            </div>
            <div className="space-y-1 border-t border-border pt-3">
              <p className="text-sm font-medium text-destructive">Remove property</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Deletes rooms, rates, tickets and reporting history for {property.shortName}. Financial
                records are retained for seven years.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 h-7 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Remove property
              </Button>
            </div>
          </div>
        </Panel>
      </TabsContent>

      {/* --------------------------- notifications --------------------------- */}
      <TabsContent value="notifications">
        <Panel
          title="Notifications"
          description="What Occuply tells you about, and when"
          bodyClassName="divide-y divide-border"
        >
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="flex items-start gap-4 px-4 py-3.5 lg:px-5">
              <div className="min-w-0 flex-1">
                <Label htmlFor={`notif-${n.id}`} className="text-sm font-medium">
                  {n.label}
                </Label>
                <p className="max-w-[72ch] text-xs leading-relaxed text-muted-foreground">
                  {n.description}
                </p>
              </div>
              <Switch
                id={`notif-${n.id}`}
                checked={notifs[n.id]}
                onCheckedChange={(v) => setNotifs((s) => ({ ...s, [n.id]: v }))}
              />
            </div>
          ))}
        </Panel>
      </TabsContent>
    </Tabs>
  )
}

function Field({
  id,
  label,
  defaultValue,
  type = "text",
  help,
}: {
  id: string
  label: string
  defaultValue: string
  type?: string
  help?: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <Input id={id} type={type} defaultValue={defaultValue} className="h-9 text-sm" />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  )
}
