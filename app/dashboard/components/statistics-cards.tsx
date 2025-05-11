"use client"

import { Card } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { motion } from "framer-motion"
import type { Database } from "@/lib/supabase/database.types"

type Message = Database["public"]["Tables"]["messages"]["Row"]

interface StatisticsCardsProps {
  messages: Message[]
  viewCount: number
}

export function StatisticsCards({ messages, viewCount }: StatisticsCardsProps) {
  // Calculate stats
  const totalMessages = messages.length
  const repliedMessages = messages.filter((m) => m.reply).length
  const unrepliedMessages = totalMessages - repliedMessages
  const replyRate = totalMessages > 0 ? Math.round((repliedMessages / totalMessages) * 100) : 0

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <motion.div className="mb-8" variants={container} initial="hidden" animate="show">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div variants={item}>
          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pesan</p>
                <AnimatedCounter value={totalMessages} className="text-xl font-bold" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dibalas</p>
                <AnimatedCounter value={repliedMessages} className="text-xl font-bold" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Belum Dibalas</p>
                <AnimatedCounter value={unrepliedMessages} className="text-xl font-bold" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tayangan</p>
                <AnimatedCounter value={viewCount} className="text-xl font-bold" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
