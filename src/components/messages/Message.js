import React from "react"

import { formatMessageTime } from "../../utility/conversions"

const Message = props => {
    return (
        <>
            { 
                props.time && <p style = {{ 
                    textAlign: "center", 
                    margin: 0, 
                    color: props.theme.palette.getContrastText(props.theme.palette.background.default)  
                }}>{formatTime(props.time)}</p> 
            }

            <div className = {props.className} style = {{ 
                backgroundColor: props.isMe ? props.theme.palette.primary.main : props.theme.palette.secondary.main,
                color: props.isMe ? props.theme.palette.primary.contrastText : props.theme.palette.secondary.contrastText
            }}>
                { 
                    props.showSender && 
                    <h4 style = {{ 
                        textAlign: props.isMe ? "end" : "start", 
                        margin: 0,
                        color: props.isMe ? props.theme.palette.primary.contrastText : props.theme.palette.secondary.contrastText
                    }}>
                        {props.isMe ? "You" : props.message.sender}
                    </h4> 
                }

                <p>{props.message.content}</p>

                <p className = "timestamp" style = {{
                    textAlign: props.isMe ? "right" : "left"
                }}>{formatMessageTime(props.timestamp)}</p>
            </div>
        </>
    )
}

export default React.memo(Message, (prevProps, nextProps) => {
    return prevProps.message.content !== nextProps.message.content ||
           prevProps.className       !== nextProps.className       ||
           prevProps.showSender      !== nextProps.showSender      ||
           prevProps.isPersonal      !== nextProps.isPersonal
})

function formatTime(date) {
    const currentDate = new Date()

    if(currentDate.getFullYear() === date.getFullYear() && currentDate.getMonth() === date.getMonth() && currentDate.getDate() === date.getDate()) {
        return formatMessageTime(date)
    }

    return date.toLocaleDateString()
}