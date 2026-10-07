import { RefObject, useEffect, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';

/**
 * Cuántos píxeles tapa el teclado a `containerRef` (0 si no lo tapa o está cerrado).
 *
 * Sirve dentro de un `Modal`, donde `KeyboardAvoidingView` y `adjustResize` no son fiables en
 * Android. Al medir contra la posición real del teclado, no hay doble desplazamiento si el
 * sistema ya redimensionó la ventana.
 */
export function useKeyboardOverlap(containerRef: RefObject<View | null>) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      containerRef.current?.measureInWindow((_x, y, _width, height) => {
        setOverlap(Math.max(0, y + height - event.endCoordinates.screenY));
      });
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setOverlap(0),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, [containerRef]);

  return overlap;
}
