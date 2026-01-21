"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface SwipeableDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  onSwipeClose?: () => void;
  swipeThreshold?: number;
}

const SwipeableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SwipeableDialogContentProps
>(({ className, children, onSwipeClose, swipeThreshold = 100, ...props }, ref) => {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, swipeThreshold], [1, 0.5])
  const scale = useTransform(y, [0, swipeThreshold], [1, 0.95])

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > swipeThreshold && onSwipeClose) {
      onSwipeClose()
    }
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ 
          padding: '1rem',
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))', 
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}
      >
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "relative w-full max-w-lg border bg-background shadow-lg rounded-lg max-h-[85vh] overflow-hidden pointer-events-auto",
            className
          )}
          asChild
          {...props}
        >
          <motion.div
            style={{ y, opacity, scale }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="relative flex flex-col max-h-[85vh]"
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full z-10" />
            <div className="pt-6 px-5 pb-5 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  )
})
SwipeableDialogContent.displayName = "SwipeableDialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  SwipeableDialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
