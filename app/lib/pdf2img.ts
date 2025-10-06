// pdf2img.ts
export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    // ✅ Only run in browser
    if (typeof window === "undefined") {
        return {
            imageUrl: "",
            file: null,
            error: "PDF conversion is only supported in the browser.",
        };
    }

    try {
        // ✅ Dynamically import to avoid SSR execution
        const pdfjsLib = await import("pdfjs-dist");
        const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.mjs?url");

        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 3 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            canvas,
            viewport,
        } as any).promise;

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve({ imageUrl: "", file: null, error: "Failed to create image blob" });
                    return;
                }

                const imageFile = new File([blob], file.name.replace(/\.pdf$/i, ".png"), {
                    type: "image/png",
                });
                resolve({
                    imageUrl: URL.createObjectURL(blob),
                    file: imageFile,
                });
            }, "image/png");
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}


