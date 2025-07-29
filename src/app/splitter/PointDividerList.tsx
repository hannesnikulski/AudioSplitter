import { RefObject, useState } from "react"

import { Button, Dropdown, DropdownItem, Label, Modal, ModalBody, TextInput } from "flowbite-react"

import { Point } from "@/lib/types"
import { formatTime } from "@/lib/misc"
import { IoMdTrash } from "react-icons/io"
import { IoWarning } from "react-icons/io5"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FaArrowLeft, FaArrowRight, FaEdit } from "react-icons/fa"

import { WaveformView } from "./Waveform"

type Props = {
    points: Point[],
    peaksComponentRef: RefObject<WaveformView | null>
}

export default function PointDividerList({ points, peaksComponentRef }: Props) {
    const [openEditModal, setOpenEditModal] = useState(false)
    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [menuPoint, setMenuPoint] = useState<Point | null>(null)

    const unselected = points.filter((p) => !p.selected)
    const selected = points.filter((p) => p.selected)

    const onEdit = (point: Point) => {
        const newLabel = prompt('New Name', point.labelText)
        if (newLabel !== null) {
            peaksComponentRef.current?.renamePoint(point.id, newLabel)
        }
    }

    const onDelete = (point: Point) => {
        const conf = confirm(`Are you sure you want to delete the Point ${point.labelText}?`)
        if (conf) {
            peaksComponentRef.current?.removePoint(point.id)
        }
    }

    const onLabelChange = (point: Point | null) => {
        const inputElement = document.getElementById('markerLabel') as HTMLInputElement
        const newLabel = inputElement.value
        if (newLabel && point) {
            peaksComponentRef.current?.renamePoint(point.id, newLabel)
        }
        setOpenEditModal(false)
    }

    const onMarkerDelete = (point: Point | null) => {
        if (point) {
            peaksComponentRef.current?.removePoint(point.id)
        }
        setOpenDeleteModal(false)
    }

    return (
        <div className="grow flex min-h-0 divide-x divide-gray-200">
            <div className="flex flex-col w-full min-h-0">
                <div className="p-2 text-center text-lg font-medium text-gray-600 border-b border-gray-200">
                    Unselected Markers
                </div>
                <ul className="overflow-y-auto m-1">
                    {unselected.map((point) => (
                        <li key={point.id} className="flex items-center p-1 rounded hover:bg-primary-50">
                            <span className="flex w-full p-1 font-light" onClick={() => peaksComponentRef.current?.seekToPoint(point.id)}>
                                {point.labelText}
                            </span>

                            <Button className="w-8 h-8 p-1.5 cursor-pointer rounded border-0" size="sm" outline onClick={() => peaksComponentRef.current?.selectPoint(point.id)}>
                                <FaArrowRight />
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex flex-col w-full min-h-0">
                <div className="relative flex items-center justify-center p-2 text-lg font-medium text-gray-600 border-b border-gray-200">
                    <span>Selected Markers</span>
                    <Button className="absolute right-2 px-2.5 py-1.5 cursor-pointer rounded" size="xs" onClick={() => peaksComponentRef.current?.sortPoints()}>Sort Points</Button>
                </div>
                <ul className="overflow-y-auto m-1">
                    {selected.map((point) => (
                        <li key={point.id} className="flex items-center gap-2 p-1 rounded hover:bg-primary-50">
                            <Button className="w-8 h-8 p-1.5 cursor-pointer rounded border-0" size="sm" outline onClick={() => peaksComponentRef.current?.deselectPoint(point.id)}>
                                <FaArrowLeft />
                            </Button>

                            <span className="flex items-center justify-between w-full p-1 font-light" onClick={() => peaksComponentRef.current?.seekToPoint(point.id)}>
                                <span>{point.labelText}</span>
                                <span className="text-xs">{formatTime(point.time)}</span>
                            </span>

                            <Dropdown
                                label="Dropdown"
                                renderTrigger={() => <Button className="w-8 h-8 p-1.5 cursor-pointer rounded border-0" size="sm" outline><BsThreeDotsVertical /></Button>}
                            >
                                <DropdownItem icon={FaEdit} onClick={() => { setOpenEditModal(true); setMenuPoint(point) }}>Edit Label</DropdownItem>
                                <DropdownItem icon={IoMdTrash} onClick={() => setOpenDeleteModal(true)} className="hover:text-red-800 hover:!bg-red-100">Remove Marker</DropdownItem>
                            </Dropdown>
                        </li>
                    ))}
                </ul>
            </div>
            <Modal show={openEditModal} onClose={() => setOpenEditModal(false)}>
                <ModalBody className="space-y-6">
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="markerLabel">New Label</Label>
                        </div>
                        <TextInput id="markerLabel" type="text" required placeholder={menuPoint?.labelText} />
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => onLabelChange(menuPoint)}>Confirm</Button>
                        <Button color="alternative" onClick={() => setOpenEditModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
            <Modal show={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
                <ModalBody className="flex flex-col items-center space-y-4">
                    <div className="flex justify-center">
                        <IoWarning className="w-16 h-16 text-gray-600" />
                    </div>
                    <p>Are you sure you want to delete the marker <b>{menuPoint?.labelText}</b>?</p>
                    <div className="flex gap-2">
                        <Button color="red" onClick={() => onMarkerDelete(menuPoint)}>Confirm</Button>
                        <Button color="alternative" onClick={() => setOpenDeleteModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    )
}