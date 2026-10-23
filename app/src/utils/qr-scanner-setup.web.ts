import { setZXingModuleOverrides, ZXING_WASM_VERSION } from 'barcode-detector';

/**
 * En la web, `expo-camera` lee el QR con `barcode-detector` cuando el navegador no trae
 * `BarcodeDetector` (Chrome y Brave en Linux, Firefox). Ese lector descarga `zxing_reader.wasm`
 * de `fastly.jsdelivr.net`, que algunas redes bloquean: se sirve desde la propia app
 * (`public/zxing_reader-<versión>.wasm`). Al actualizar `barcode-detector`, copia el `.wasm` de la
 * nueva versión de `zxing-wasm` (`dist/reader/zxing_reader.wasm`) con su número en el nombre.
 */
setZXingModuleOverrides({
  locateFile: (path: string, prefix: string) =>
    path.endsWith('.wasm') ? `/zxing_reader-${ZXING_WASM_VERSION}.wasm` : prefix + path,
});
