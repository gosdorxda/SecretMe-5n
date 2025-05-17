"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

interface DeleteMessageDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  isDeleting: boolean
}

export function DeleteMessageDrawer({ open, onOpenChange, onDelete, isDeleting }: DeleteMessageDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">Hapus Pesan</DrawerTitle>
          <DrawerDescription className="text-base">
            Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex items-start gap-3 px-4 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-base text-red-600">
              Semua balasan terkait pesan ini juga akan dihapus dan tidak dapat dipulihkan.
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 mx-4 rounded-md border-2 border-red-500 text-base text-red-800">
          <div className="font-bold mb-2">Peringatan:</div>
          <ul className="list-disc pl-5 space-y-2">
            <li>Semua balasan terkait pesan ini juga akan dihapus</li>
            <li>Pesan yang dihapus tidak dapat dipulihkan</li>
          </ul>
        </div>
        <DrawerFooter className="flex-row justify-end gap-3 mt-6 mb-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 text-base font-medium border-2 border-black rounded-md bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Batal
          </Button>
          <Button
            onClick={onDelete}
            variant="destructive"
            className="h-10 px-5 text-base font-medium border-2 border-black rounded-md bg-red-500 hover:bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Menghapus...
              </>
            ) : (
              "Hapus"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
