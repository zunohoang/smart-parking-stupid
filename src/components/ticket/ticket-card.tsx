import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { DetailRow, StatusBadge } from '../ui';
import type { ParkingSession } from '../../types/parking';
import { vehicleLabels } from '../../types/parking';
import { dateTime } from '../../utils/format';
import { displayPlate } from '../../utils/plate';
import { ticketReference } from '../../services/tickets/reference';
export function TicketCard({ session, lotName }: { session: ParkingSession; lotName: string }) {
  return (
    <View className="gap-4 rounded-md border border-line bg-white p-5">
      <View className="items-center gap-2 border-b border-line pb-4">
        <Text className="text-base font-bold text-ink">{lotName}</Text>
        <Text className="text-xs font-semibold tracking-widest text-muted">VÉ GIỮ XE ĐIỆN TỬ</Text>
      </View>
      <Text selectable className="text-center text-3xl font-bold tracking-wider text-ink">
        {displayPlate(session.plateNumber)}
      </Text>
      <View className="self-center">
        <StatusBadge completed={session.status === 'COMPLETED'} />
      </View>
      <View>
        <DetailRow label="Mã vé" value={session.ticketCode} />
        <DetailRow label="Phương tiện" value={vehicleLabels[session.vehicleType]} />
        <DetailRow label="Thời gian vào" value={dateTime(session.checkedInAt)} />
      </View>
      <View className="items-center gap-3 py-2">
        <QRCode
          value={ticketReference(session.ticketCode)}
          size={152}
          color="#0F172A"
          backgroundColor="#FFFFFF"
        />
        <Text className="text-xs text-muted">Vé điện tử — bản demo</Text>
      </View>
    </View>
  );
}
