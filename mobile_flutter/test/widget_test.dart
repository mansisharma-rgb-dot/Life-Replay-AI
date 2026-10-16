import 'package:flutter_test/flutter_test.dart';
import 'package:life_replay_ai/main.dart';

void main() {
  testWidgets('LifeReplayApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const LifeReplayApp());
    expect(find.byType(LifeReplayApp), findsOneWidget);
    await tester.pump(const Duration(seconds: 3));
  });
}
