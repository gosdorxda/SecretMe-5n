"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useLanguage } from "@/lib/i18n/language-context"

interface DeleteMessageDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  isDeleting: boolean
}

export function DeleteMessageDrawer({ open, onOpenChange, onDelete, isDeleting }: DeleteMessageDrawerProps) {
  const { locale } = useLanguage()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{locale === "en" ? "Delete Message" : "Hapus Pesan"}</DrawerTitle>
            <DrawerDescription>
              {locale === "en"
                ? "Are you sure you want to delete this message? This action cannot be undone."
                : "Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan."}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
              {isDeleting
                ? locale === "en"
                  ? "Deleting..."
                  : "Menghapus..."
                : locale === "en"
                  ? "Delete Message"
                  : "Hapus Pesan"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">{locale === "en" ? "Cancel" : "Batal"}</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
