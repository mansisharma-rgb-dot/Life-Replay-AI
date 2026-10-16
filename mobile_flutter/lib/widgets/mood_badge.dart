import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class MoodBadge extends StatelessWidget {
  final int moodScore;
  final String? label;
  final double size;

  const MoodBadge({
    super.key,
    required this.moodScore,
    this.label,
    this.size = 36,
  });

  String get emoji {
    if (moodScore >= 9) return '🤩';
    if (moodScore >= 7) return '😊';
    if (moodScore >= 5) return '😌';
    if (moodScore >= 3) return '😔';
    return '😫';
  }

  Color get color {
    if (moodScore >= 9) return AppColors.moodEcstatic;
    if (moodScore >= 7) return AppColors.moodHappy;
    if (moodScore >= 5) return AppColors.moodContent;
    if (moodScore >= 3) return AppColors.moodSad;
    return AppColors.moodStressed;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: label != null ? 12 : 8,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(90), width: 1.2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: TextStyle(fontSize: size * 0.5)),
          if (label != null) ...[
            const SizedBox(width: 6),
            Text(
              label!,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
