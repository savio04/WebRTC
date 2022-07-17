import { forwardRef, ForwardRefRenderFunction, HTMLAttributes, MouseEventHandler, useEffect, useRef, useState, VideoHTMLAttributes } from "react";
import { Container, Video } from "./styles";

interface IDraggableProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Draggable ({children, ...rest}: IDraggableProps) {
  const [pressed, setPressed] = useState(false)
  const [position, setPosition] = useState<{x: number; y: number;} | null>({x: 0, y: 0})
  const divRef = useRef<HTMLDivElement | null>(null)

  // Monitor changes to position state and update DOM
  useEffect(() => {
    if(position && divRef.current) {
      divRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`
    }
  }, [position])

  // Update the current position if mouse is down
  const onMouseMove = (event: any, type = 'normal') => {
    if(pressed || type === 'mobile') {
      setPosition({
        x: position ? position.x + event.movementX || 50 : event.movementX,
        y: position ? position.y + event.movementY || 50 : event.movementY
      })
    }
  }

  return (
    <Container
      ref={divRef}
      onMouseMove = {onMouseMove}
      onMouseDown={ () => setPressed(true) }
      onMouseUp={ () => setPressed(false) }
      onMouseOut={() => setPressed(false)}
      onTouchMove={(event) => onMouseMove(event, 'mobile')}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      // onTouchMoveCapture={onMouseMove}
      {...rest}
    >
      {children}
    </Container>
  )
}