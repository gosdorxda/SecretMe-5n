import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { SeoMeta } from "@/components/seo-meta"
import { Button } from "@/components/ui/button"
import { Crown, AtSign, User, FileText, Link2, MessageSquare, BarChart2, ChevronRight, Check } from "lucide-react"

export const metadata: Metadata = {
  title: "SecretMe Premium Features - Enhance Your Anonymous Messaging Experience",
  description:
    "Explore all SecretMe premium features that will enhance your anonymous messaging experience with exclusive capabilities.",
}

export default function FeaturesPage() {
  return (
    <>
      <SeoMeta
        title="SecretMe Premium Features - Enhance Your Anonymous Messaging Experience"
        description="Explore all SecretMe premium features that will enhance your anonymous messaging experience with exclusive capabilities."
      />

      <div className="container py-4 md:py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-amber-100 rounded-full mb-3">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3">SecretMe Premium Features</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            Enhance your anonymous messaging experience with exclusive features only available to premium users.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-8">
          {/* Feature 1: Custom Username */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2">
            <div className="p-4 md:p-6 flex flex-col justify-center">
              <div className="inline-flex items-center justify-center p-2 bg-amber-100 rounded-full mb-3 w-8 h-8 md:w-10 md:h-10">
                <AtSign className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Permanent Custom Username</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Choose a unique username that reflects your identity. This username will be part of your profile URL
                forever, making it easier for others to find and remember your profile.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-block bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  POPULAR FEATURE
                </span>
                <Link
                  href="/en/premium"
                  className="text-amber-600 hover:text-amber-700 text-xs md:text-sm font-medium flex items-center group"
                >
                  Upgrade{" "}
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-medium text-sm md:text-base text-gray-800 flex items-center">
                    <span>Choose Your Username</span>
                    <div className="ml-auto bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full">Premium</div>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-2 md:px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs md:text-sm">
                          secretme.com/
                        </span>
                        <input
                          type="text"
                          className="flex-1 min-w-0 block w-full px-2 md:px-3 py-1.5 md:py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-xs md:text-sm"
                          placeholder="your-username"
                          defaultValue="johndoe"
                        />
                      </div>
                    </div>
                    <div className="flex items-center text-xs md:text-sm text-green-600">
                      <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Username available!
                    </div>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs md:text-sm py-1.5">
                      Save Username
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Profile Photo */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2">
            <div className="p-4 md:p-6 flex flex-col justify-center">
              <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-3 w-8 h-8 md:w-10 md:h-10">
                <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Custom Profile Photo</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Upload your profile photo to add a personal touch to your profile page. Make a memorable first
                impression and enhance your profile's credibility with a professional photo.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  PERSONALIZATION
                </span>
                <Link
                  href="/en/premium"
                  className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium flex items-center group"
                >
                  Upgrade{" "}
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-medium text-sm md:text-base text-gray-800 flex items-center">
                    <span>Upload Profile Photo</span>
                    <div className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">Premium</div>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-blue-100 flex items-center justify-center mb-3 relative overflow-hidden border-2 border-white shadow-md">
                        <Image
                          src="/diverse-profile-avatars.png"
                          alt="Profile Preview"
                          width={200}
                          height={200}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <div className="text-white text-xs font-medium">Change</div>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 mb-2">Upload JPG or PNG photo</p>
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm py-1.5">
                        Choose Photo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Complete Bio */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2">
            <div className="p-4 md:p-6 flex flex-col justify-center">
              <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-3 w-8 h-8 md:w-10 md:h-10">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Complete Profile Bio</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Add a complete description about yourself. Tell who you are, what you like, or what you want people to
                know about you. An engaging bio will increase your profile's engagement.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  SELF-EXPRESSION
                </span>
                <Link
                  href="/en/premium"
                  className="text-green-600 hover:text-green-700 text-xs md:text-sm font-medium flex items-center group"
                >
                  Upgrade{" "}
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-medium text-sm md:text-base text-gray-800 flex items-center">
                    <span>Edit Profile Bio</span>
                    <div className="ml-auto bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">Premium</div>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Your Bio</label>
                      <textarea
                        className="w-full px-2 md:px-3 py-1.5 md:py-2 rounded-md border border-gray-300 focus:ring-green-500 focus:border-green-500 text-xs md:text-sm"
                        rows={3}
                        placeholder="Tell about yourself..."
                        defaultValue="Hello! I'm John, a graphic designer and photographer based in Jakarta. I enjoy sharing my work and getting feedback from the creative community."
                      ></textarea>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm text-gray-500">
                      <span>Text formatting available</span>
                      <span>156/300</span>
                    </div>
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm py-1.5">
                      Save Bio
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Social Media Links */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2">
            <div className="p-4 md:p-6 flex flex-col justify-center">
              <div className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-full mb-3 w-8 h-8 md:w-10 md:h-10">
                <Link2 className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Social Media Links</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Connect your social media profiles like Instagram, Twitter, Facebook, LinkedIn, and TikTok to make it
                easier for people to find you on other platforms. Increase your reach and connections.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  NEW FEATURE
                </span>
                <Link
                  href="/en/premium"
                  className="text-purple-600 hover:text-purple-700 text-xs md:text-sm font-medium flex items-center group"
                >
                  Upgrade{" "}
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-medium text-sm md:text-base text-gray-800 flex items-center">
                    <span>Add Social Media Links</span>
                    <div className="ml-auto bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                      Premium
                    </div>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Instagram</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-2 md:px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs md:text-sm">
                          instagram.com/
                        </span>
                        <input
                          type="text"
                          className="flex-1 min-w-0 block w-full px-2 md:px-3 py-1.5 md:py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500 text-xs md:text-sm"
                          placeholder="username"
                          defaultValue="johndoe.design"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Twitter</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-2 md:px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs md:text-sm">
                          twitter.com/
                        </span>
                        <input
                          type="text"
                          className="flex-1 min-w-0 block w-full px-2 md:px-3 py-1.5 md:py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500 text-xs md:text-sm"
                          placeholder="username"
                        />
                      </div>
                    </div>
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs md:text-sm py-1.5">
                      Save Links
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5: Notifications */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2">
            <div className="p-4 md:p-6 flex flex-col justify-center">
              <div className="inline-flex items-center justify-center p-2 bg-cyan-100 rounded-full mb-3 w-8 h-8 md:w-10 md:h-10">
                <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">WhatsApp & Telegram Notifications</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Get instant notifications via WhatsApp and Telegram whenever you receive a new message. No need to check
                manually anymore, you'll always get real-time notifications.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-block bg-cyan-100 text-cyan-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  POPULAR FEATURE
                </span>
                <Link
                  href="/en/premium"
                  className="text-cyan-600 hover:text-cyan-700 text-xs md:text-sm font-medium flex items-center group"
                >
                  Upgrade{" "}
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-medium text-sm md:text-base text-gray-800 flex items-center">
                    <span>Configure Notifications</span>
                    <div className="ml-auto bg-cyan-100 text-cyan-600 text-xs px-2 py-0.5 rounded-full">Premium</div>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-green-600"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                          </div>
                          <span className="font-medium text-xs md:text-sm">WhatsApp</span>
                        </div>
                        <div className="relative inline-block w-8 md:w-10 mr-2 align-middle select-none">
                          <input
                            type="checkbox"
                            name="toggle"
                            id="whatsapp-toggle"
                            className="toggle-checkbox sr-only peer"
                            defaultChecked
                          />
                          <div className="block h-4 md:h-6 bg-gray-200 rounded-full w-8 md:w-11 peer-checked:bg-cyan-500"></div>
                          <div className="dot absolute left-1 top-1 bg-white w-2 h-2 md:w-4 md:h-4 rounded-full transition peer-checked:translate-x-4 md:peer-checked:translate-x-5"></div>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="w-full px-2 md:px-3 py-1 md:py-2 rounded-md border border-gray-300 focus:ring-cyan-500 focus:border-cyan-500 text-xs md:text-sm"
                        placeholder="+62 8xx xxxx xxxx"
                        defaultValue="+62 812 3456 7890"
                      />
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-600"
                            >
                              <path d="M21.5 12a9.5 9.5 0 1 1-9.5-9.5 9.46 9.46 0 0 1 9.5 9.5Z"></path>
                              <path d="m12 7 1.5 2.5h2.5l-1.5 2.5 1.5 2.5h-2.5L12 17l-1.5-2.5H8l1.5-2.5L8 9.5h2.5L12 7Z"></path>
                            </svg>
                          </div>
                          <span className="font-medium text-xs md:text-sm">Telegram</span>
                        </div>
                        <div className="relative inline-block w-8 md:w-10 mr-2 align-middle select-none">
                          <input
                            type="checkbox"
                            name="toggle"
                            id="telegram-toggle"
                            className="toggle-checkbox sr-only peer"
                            defaultChecked
                          />
                          <div className="block h-4 md:h-6 bg-gray-200 rounded-full w-8 md:w-11 peer-checked:bg-cyan-500"></div>
                          <div className="dot absolute left-1 top-1 bg-white w-2 h-2 md:w-4 md:h-4 rounded-full transition peer-checked:translate-x-4 md:peer-checked:translate-x-5"></div>
                        </div>
                      </div>
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 md:py-1.5">
                        Connect Telegram
                      </Button>
                    </div>
                    <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-xs md:text-sm py-1.5">
                      Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 6: Statistics */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 grid grid-cols-1 md:grid-cols-2">
            <div className="p-4 md:p-6 flex flex-col justify-center">
              <div className="inline-flex items-center justify-center p-2 bg-rose-100 rounded-full mb-3 w-8 h-8 md:w-10 md:h-10">
                <BarChart2 className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Complete Statistics</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Access complete statistics about profile visits and messages you receive. See trends and patterns to
                better understand your audience and optimize your profile based on data.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-block bg-rose-100 text-rose-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  DATA INSIGHTS
                </span>
                <Link
                  href="/en/premium"
                  className="text-rose-600 hover:text-rose-700 text-xs md:text-sm font-medium flex items-center group"
                >
                  Upgrade{" "}
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-medium text-sm md:text-base text-gray-800 flex items-center">
                    <span>Profile Statistics</span>
                    <div className="ml-auto bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full">Premium</div>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-gray-50 rounded-lg text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg md:text-xl font-bold text-rose-600">247</div>
                        <div className="text-xs text-gray-500">Profile Visits</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg md:text-xl font-bold text-rose-600">36</div>
                        <div className="text-xs text-gray-500">Messages Received</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg md:text-xl font-bold text-rose-600">18</div>
                        <div className="text-xs text-gray-500">Public Replies</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg md:text-xl font-bold text-rose-600">82%</div>
                        <div className="text-xs text-gray-500">Engagement</div>
                      </div>
                    </div>
                    <div className="h-24 md:h-32 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                      <div className="text-center text-gray-400">
                        <BarChart2 className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1" />
                        <span className="text-xs md:text-sm">Weekly Activity Chart</span>
                      </div>
                    </div>
                    <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs md:text-sm py-1.5">
                      View Complete Statistics
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section - Mobile Optimized */}
        <div className="mt-8 md:mt-16">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-base md:text-lg mb-2">Do I need a monthly subscription?</h3>
              <p className="text-xs md:text-sm text-gray-600">
                No. SecretMe Premium is a one-time lifetime payment. You only need to pay once and get access to all
                premium features forever.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-base md:text-lg mb-2">Will I get premium features in the future?</h3>
              <p className="text-xs md:text-sm text-gray-600">
                Yes. All premium features we add in the future will automatically be available to premium users at no
                additional cost.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-base md:text-lg mb-2">How do I activate WhatsApp notifications?</h3>
              <p className="text-xs md:text-sm text-gray-600">
                After upgrading to premium, you can activate WhatsApp notifications in the Settings tab of your
                dashboard. Follow the provided instructions to connect your WhatsApp number.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-base md:text-lg mb-2">Can I change my username after choosing it?</h3>
              <p className="text-xs md:text-sm text-gray-600">
                Yes. As a premium user, you can change your username anytime through your profile settings in your
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
