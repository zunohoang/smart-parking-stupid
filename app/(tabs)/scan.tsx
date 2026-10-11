import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { Camera, Flashlight, Keyboard, RotateCcw } from 'lucide-react-native';
import { AppHeader, Button, Choice, Field, Notice, Screen, SecondaryButton } from '@/components/ui';
import { PlateNumberInput } from '@/components/parking';
import { CameraFrameOverlay, ScanModeSelector, type ScanMode } from '@/components/scanner';
import { useParkingStore } from '@/stores/parking-store';
import { demoPlates } from '@/constants/defaults';
import { recognizer, type RecognitionResult } from '@/services/recognition/recognizer';
import { errorMessage } from '@/utils/format';
import { isValidPlate, normalizePlate } from '@/utils/plate';
import { findActiveSession } from '@/features/parking/selectors';
export default function Scanner() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const focused = useIsFocused();
  const [mode, setMode] = useState<ScanMode>(params.mode === 'out' ? 'out' : 'in');
  const settings = useParkingStore((s) => s.settings)!;
  const sessions = useParkingStore((s) => s.sessions);
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [sample, setSample] = useState(demoPlates[0]!);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editVersion = useRef(0);
  useEffect(() => {
    if (params.mode) setMode(params.mode === 'out' ? 'out' : 'in');
  }, [params.mode]);
  useEffect(() => {
    if (!focused) {
      setCameraReady(false);
      setTorch(false);
    }
  }, [focused]);
  const changePlate = (value: string) => {
    editVersion.current++;
    setPlate(value);
    setError(null);
  };
  const reset = () => {
    editVersion.current++;
    setPlate('');
    setPhoto(null);
    setRecognition(null);
    setError(null);
    setCameraOpen(false);
    setCameraReady(false);
    setTorch(false);
  };
  async function openCamera() {
    setError(null);
    try {
      const result = permission?.granted ? permission : await requestPermission();
      if (result.granted) {
        setPhoto(null);
        setCameraReady(false);
        setCameraOpen(true);
      } else setError('Chưa có quyền camera. Bạn vẫn có thể nhập biển số bên dưới.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function simulate(image: string | null = photo) {
    const version = editVersion.current;
    setBusy(true);
    setError(null);
    try {
      const result = await recognizer.recognize(image, sample);
      setRecognition(result);
      if (version === editVersion.current && !plate.trim()) setPlate(result.normalizedPlate);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function capture() {
    if (!camera.current || !cameraReady) return;
    setBusy(true);
    setError(null);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.65 });
      if (!picture?.uri) throw new Error('Không chụp được ảnh. Vui lòng thử lại.');
      setPhoto(picture.uri);
      setCameraOpen(false);
      setTorch(false);
      if (settings.demoMode) await simulate(picture.uri);
      else setRecognition(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function proceed() {
    if (!isValidPlate(plate)) {
      setError('Vui lòng nhập biển số hợp lệ, ví dụ 59-X1 123.45.');
      return;
    }
    if (mode === 'in')
      router.push({
        pathname: '/check-in/confirm',
        params: {
          plate: normalizePlate(plate),
          raw: recognition?.rawText ?? plate,
          image: photo ?? '',
        },
      });
    else {
      try {
        const session = findActiveSession(sessions, plate);
        router.push({
          pathname: '/check-out/confirm',
          params: { id: session.id, image: photo ?? '' },
        });
      } catch (e) {
        setError(errorMessage(e));
      }
    }
  }
  return (
    <Screen>
      <AppHeader title="Quét biển số" subtitle="Chụp biển số hoặc nhập thủ công" />
      <ScanModeSelector
        value={mode}
        onChange={(value) => {
          setMode(value);
          setError(null);
        }}
      />
      <View className="overflow-hidden rounded-md bg-slate-900" style={{ height: 260 }}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        ) : cameraOpen && permission?.granted && focused ? (
          <View className="flex-1">
            <CameraView
              ref={camera}
              style={{ flex: 1 }}
              facing="back"
              enableTorch={torch}
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => {
                setCameraOpen(false);
                setError('Camera chưa khả dụng. Hãy nhập biển số hoặc dùng chế độ demo.');
              }}
            />
            <CameraFrameOverlay />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bật hoặc tắt đèn pin"
              className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-md bg-slate-800"
              onPress={() => setTorch(!torch)}
            >
              <Flashlight color={torch ? '#FBBF24' : 'white'} size={20} />
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Camera size={32} color="#94A3B8" />
            <Text className="text-center text-base font-medium text-white">
              Sẵn sàng quét biển số
            </Text>
            <Text className="text-center text-sm leading-5 text-slate-300">
              Mở camera để chụp. Bạn có thể nhập tay khi không có camera.
            </Text>
          </View>
        )}
      </View>
      {cameraOpen && !photo ? (
        <Button
          loading={busy}
          disabled={!cameraReady}
          icon={<Camera color="white" size={21} />}
          onPress={() => void capture()}
        >
          Chụp biển số
        </Button>
      ) : (
        <SecondaryButton
          icon={<Camera color="#0F172A" size={19} />}
          onPress={() => void openCamera()}
        >
          {photo ? 'Chụp lại ảnh' : 'Mở camera'}
        </SecondaryButton>
      )}
      {permission && !permission.granted && !permission.canAskAgain ? (
        <SecondaryButton onPress={() => void Linking.openSettings()}>
          Mở cài đặt quyền camera
        </SecondaryButton>
      ) : null}
      {settings.demoMode ? (
        <View className="gap-3 rounded-md border border-line bg-white p-4">
          <Text className="text-sm font-semibold text-ink">Mô phỏng nhận diện</Text>
          <Text className="text-xs leading-5 text-muted">
            Chọn biển số mẫu để thử quy trình. Đây không phải kết quả OCR thật.
          </Text>
          <Choice
            value={sample}
            onChange={setSample}
            options={demoPlates.map((p) => ({ value: p, label: p }))}
          />
          <SecondaryButton disabled={busy} onPress={() => void simulate()}>
            Nhận diện mô phỏng
          </SecondaryButton>
        </View>
      ) : (
        <Notice>Chưa cấu hình dịch vụ OCR. Hãy đối chiếu ảnh và nhập biển số thủ công.</Notice>
      )}
      {recognition ? (
        <Notice>
          {recognition.message}
          {plate !== recognition.normalizedPlate
            ? ' Biển số đang dùng đã được chỉnh sửa thủ công.'
            : ''}
        </Notice>
      ) : null}
      <Field label="Biển số xác nhận">
        <PlateNumberInput value={plate} onChangeText={changePlate} />
      </Field>
      {error ? <Notice error>{error}</Notice> : null}
      <Button disabled={busy} icon={<Keyboard color="white" size={18} />} onPress={proceed}>
        {mode === 'in' ? 'Tiếp tục nhận xe' : 'Tìm xe để trả'}
      </Button>
      {mode === 'out' ? (
        <SecondaryButton onPress={() => router.navigate('/vehicles')}>
          Tìm trong danh sách xe
        </SecondaryButton>
      ) : null}
      <SecondaryButton icon={<RotateCcw color="#64748B" size={17} />} onPress={reset}>
        Quét lượt mới
      </SecondaryButton>
    </Screen>
  );
}
