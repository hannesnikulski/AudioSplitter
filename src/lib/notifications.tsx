import { toast, ToastContentProps } from "react-toastify"

export type Notification = { type: 'Info' | 'Warning', message: string, id: number }

export const sendNotification = (notification: Notification) => {
    const NotificationComponent = ({ closeToast }: ToastContentProps) => {
        const colorMap = {
            'Info': 'text-blue-800 bg-blue-50 border-blue-300',
            'Warning': 'text-yellow-800 bg-yellow-50 border-yellow-300',
            'Success': 'text-green-800 bg-green-50 border-green-300',
        }

        const colorBtnMap = {
            'Info': 'bg-blue-50 text-blue-500 focus:ring-blue-400 hover:bg-blue-200',
            'Warning': 'bg-yellow-50 text-yellow-500 focus:ring-yellow-400 hover:bg-yellow-200',
            'Success': 'bg-green-50 text-green-500 focus:ring-green-400 hover:bg-green-200',
        }

        return (
            <div className={"min-w-md flex items-center p-4 mb-4 rounded-lg border " + colorMap[notification.type]} role="alert">
                <div className="text-sm font-medium">
                    {notification.message}
                </div>
                <button
                    type="button"
                    className={"ms-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 " + colorBtnMap[notification.type]}
                    aria-label="Close"
                    onClick={closeToast}
                >
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            </div>
        )
    }

    toast(NotificationComponent, {
        closeButton: false,
        hideProgressBar: true,
        toastId: notification.id
    })
}
