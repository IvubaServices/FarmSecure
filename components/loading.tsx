import { Loader2 } from "lucide-react"

export function Loading({ message = "Loading..." }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
