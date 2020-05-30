import React from "react"

const Message = props => {
    console.log(props)

    return (
        <div className = "message">
            <p>{props.message.content}</p>
        </div>
    )
}

export default React.memo(Message)

function formatMessageTime(time) {
    const date = new Date(time)

    let minute = date.getMinutes()

    if(minute === 0) minute = "00"
    else if (minute <= 9) minute = "0" + minute

    const ampm = date.getHours() <= 11 ? "AM" : "PM"

    let hour = ampm === "AM" ? date.getHours() : date.getHours() - 12

    if(hour === 0) hour = "00"

    return hour + ":" + minute + " " + ampm
}

function formatTime(date) {
    const currentDate = new Date()

    if(currentDate.getFullYear() === date.getFullYear() && currentDate.getMonth() === date.getMonth() && currentDate.getDate() === date.getDate()) {
        return formatMessageTime(date)
    }

    return date.toLocaleDateString()
}