import { VideoUploadForm } from "@/components/video-upload-form";

export default function VideoUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Video Generation Upload
        </h1>
        <VideoUploadForm />
      </div>
    </div>
  );
}
