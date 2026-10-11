import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Settings,
  TriangleAlert,
  Inbox,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 32,
              gap: 20,
              width: '100%',
              maxWidth: 680,
              alignSelf: 'center',
            }}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            className="flex-1 px-5 pt-5"
            style={{ width: '100%', maxWidth: 680, alignSelf: 'center' }}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function AppHeader({
  title,
  subtitle,
  back = false,
  settings = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  settings?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 flex-row items-center gap-3">
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            className="h-11 w-11 items-center justify-center rounded-md border border-line bg-white"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          >
            <ArrowLeft color="#0F172A" size={20} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-ink">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
        </View>
      </View>
      {settings ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cài đặt bãi xe"
          onPress={() => router.push('/settings')}
          className="h-11 w-11 items-center justify-center rounded-md border border-line bg-white"
        >
          <Settings color="#64748B" size={21} />
        </Pressable>
      ) : null}
    </View>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  icon,
  danger = false,
}: {
  children: string;
  onPress(): void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-md border px-4 py-3 ${secondary ? 'border-line bg-white' : danger ? 'border-danger bg-danger' : 'border-primary bg-primary'}`}
      style={({ pressed }) => ({ opacity: disabled || loading ? 0.45 : pressed ? 0.75 : 1 })}
    >
      {loading ? <ActivityIndicator color={secondary ? '#2563EB' : 'white'} /> : icon}
      <Text className={`text-base font-semibold ${secondary ? 'text-ink' : 'text-white'}`}>
        {children}
      </Text>
    </Pressable>
  );
}
export const PrimaryButton = Button;
export function SecondaryButton(props: Omit<Parameters<typeof Button>[0], 'secondary'>) {
  return <Button {...props} secondary />;
}
export function SectionTitle({ children, aside }: { children: string; aside?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text className="text-base font-semibold text-ink">{children}</Text>
      {aside ? <Text className="text-xs text-muted">{aside}</Text> : null}
    </View>
  );
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      {children}
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
export function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#94A3B8"
      {...props}
      className={`min-h-12 rounded-md border border-line bg-white px-3 py-3 text-base text-ink ${props.className ?? ''}`}
    />
  );
}
export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Tìm biển số hoặc mã vé',
}: {
  value: string;
  onChangeText(value: string): void;
  placeholder?: string;
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-md border border-line bg-white px-3">
      <Search size={18} color="#64748B" />
      <TextInput
        accessibilityLabel={placeholder}
        className="min-h-12 flex-1 py-3 text-base text-ink"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoCapitalize="characters"
      />
    </View>
  );
}
export function Notice({
  children,
  error = false,
  success = false,
}: {
  children: ReactNode;
  error?: boolean;
  success?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      className={`flex-row items-start gap-2 rounded-md border p-3 ${error ? 'border-red-200 bg-red-50' : success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}
    >
      <TriangleAlert size={17} color={error ? '#DC2626' : success ? '#15803D' : '#B45309'} />
      <Text
        selectable
        className={`flex-1 text-sm leading-5 ${error ? 'text-danger' : success ? 'text-success' : 'text-warning'}`}
      >
        {children}
      </Text>
    </View>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center gap-3 py-12">
      <Inbox color="#94A3B8" size={32} />
      <Text className="text-base font-semibold text-ink">{title}</Text>
      <Text className="text-center text-sm leading-5 text-muted">{description}</Text>
      {action}
    </View>
  );
}
export function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-canvas">
      <ActivityIndicator color="#2563EB" />
      <Text className="text-sm text-muted">Đang mở dữ liệu bãi xe…</Text>
    </View>
  );
}
export function StatusBadge({ completed }: { completed: boolean }) {
  return (
    <View
      className={`self-start rounded-sm px-2 py-1 ${completed ? 'bg-slate-100' : 'bg-green-50'}`}
    >
      <Text className={`text-xs font-medium ${completed ? 'text-muted' : 'text-success'}`}>
        {completed ? 'Đã ra bãi' : 'Đang gửi'}
      </Text>
    </View>
  );
}
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-line py-3">
      <Text className="text-sm text-muted">{label}</Text>
      <Text selectable className="flex-1 text-right text-sm font-medium text-ink">
        {value}
      </Text>
    </View>
  );
}
export function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange(value: T): void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange(option.value)}
          className={`min-h-11 flex-grow items-center justify-center rounded-md border px-3 py-2 ${value === option.value ? 'border-primary bg-blue-50' : 'border-line bg-white'}`}
        >
          <Text
            className={`text-sm font-medium ${value === option.value ? 'text-primary' : 'text-muted'}`}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function ConfirmActionSheet({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  busy,
}: {
  visible: boolean;
  title: string;
  message: string;
  onCancel(): void;
  onConfirm(): void;
  busy: boolean;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center bg-black/40 px-6">
        <View className="gap-4 rounded-md bg-white p-5">
          <Text className="text-lg font-bold text-ink">{title}</Text>
          <Text className="text-sm leading-6 text-muted">{message}</Text>
          <Button danger loading={busy} onPress={onConfirm}>
            Xác nhận đặt lại
          </Button>
          <SecondaryButton disabled={busy} onPress={onCancel}>
            Hủy
          </SecondaryButton>
        </View>
      </View>
    </Modal>
  );
}
export { ChevronRight };
