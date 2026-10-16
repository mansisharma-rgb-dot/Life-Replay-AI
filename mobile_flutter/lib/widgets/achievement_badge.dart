import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../models/achievement_model.dart';

/// Renders a distinctive, celestial collectible achievement badge with
/// custom vector emblem, multi-layer glow, locked/unlocked state, and rarity border.
class AchievementBadge extends StatelessWidget {
  final AchievementModel achievement;
  final double size;
  final bool showLabel;
  final VoidCallback? onTap;

  const AchievementBadge({
    super.key,
    required this.achievement,
    this.size = 72,
    this.showLabel = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final unlocked = achievement.isUnlocked;
    final color = _getBadgeAccentColor(achievement.idStr, achievement.name);

    Widget badgeContent = Semantics(
      label: '${achievement.name}, ${unlocked ? "Unlocked" : "Locked"} achievement: ${achievement.description}',
      button: onTap != null,
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: size,
              height: size,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Outer Glow aura (only when unlocked)
                  if (unlocked)
                    Container(
                      width: size * 0.95,
                      height: size * 0.95,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: color.withAlpha(90),
                            blurRadius: size * 0.35,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),

                  // Custom Painted Emblem Base
                  CustomPaint(
                    size: Size(size, size),
                    painter: _BadgePainter(
                      color: unlocked ? color : const Color(0xFF374151),
                      unlocked: unlocked,
                      rarity: achievement.rarityTier,
                    ),
                  ),

                  // Center Vector Icon/Symbol
                  _buildCenterIcon(unlocked, color),

                  // Lock indicator overlay when locked
                  if (!unlocked)
                    Positioned(
                      bottom: size * 0.08,
                      right: size * 0.08,
                      child: Container(
                        padding: EdgeInsets.all(size * 0.06),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1F1C38),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white24, width: 1.2),
                          boxShadow: const [
                            BoxShadow(color: Colors.black45, blurRadius: 4),
                          ],
                        ),
                        child: Icon(
                          Icons.lock_rounded,
                          size: size * 0.22,
                          color: AppColors.textMutedDark,
                        ),
                      ),
                    ),

                  // Star unlock badge overlay when unlocked
                  if (unlocked)
                    Positioned(
                      bottom: size * 0.05,
                      right: size * 0.05,
                      child: Container(
                        padding: EdgeInsets.all(size * 0.05),
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: color.withAlpha(160), blurRadius: 6),
                          ],
                        ),
                        child: Icon(
                          Icons.check_rounded,
                          size: size * 0.2,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (showLabel) ...[
              const SizedBox(height: 6),
              SizedBox(
                width: size * 1.3,
                child: Text(
                  achievement.name,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: unlocked ? AppColors.textPrimaryDark : AppColors.textMutedDark,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );

    return badgeContent;
  }

  Widget _buildCenterIcon(bool unlocked, Color color) {
    final iconData = _getBadgeIconData(achievement.idStr, achievement.name, achievement.icon);
    final iconSize = size * 0.42;

    if (!unlocked) {
      return Icon(
        iconData,
        size: iconSize,
        color: const Color(0xFF6B7280),
      );
    }

    return ShaderMask(
      shaderCallback: (bounds) => LinearGradient(
        colors: [Colors.white, color.withAlpha(240)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(bounds),
      child: Icon(
        iconData,
        size: iconSize,
        color: Colors.white,
      ),
    );
  }

  static Color _getBadgeAccentColor(String idStr, String name) {
    final key = '${idStr.toLowerCase()} ${name.toLowerCase()}';
    if (key.contains('streak_30') || key.contains('monthly')) return const Color(0xFFA855F7); // Amethyst
    if (key.contains('streak') || key.contains('flame')) return const Color(0xFFF97316); // Flame Orange
    if (key.contains('goal') || key.contains('trophy')) return const Color(0xFFFBBF24); // Gold
    if (key.contains('journal') || key.contains('reflect')) return const Color(0xFFC084FC); // Lavender
    if (key.contains('first') || key.contains('checkin')) return const Color(0xFF34D399); // Emerald Mint
    if (key.contains('early') || key.contains('sun')) return const Color(0xFFFDE047); // Radiant Sun
    if (key.contains('night') || key.contains('moon')) return const Color(0xFF818CF8); // Indigo Night
    if (key.contains('apprentice') || key.contains('skill')) return const Color(0xFF2DD4BF); // Teal
    if (key.contains('perfect') || key.contains('week')) return const Color(0xFFF472B6); // Rose Quartz
    return AppColors.primaryLight;
  }

  static IconData _getBadgeIconData(String idStr, String name, String backendIcon) {
    final key = '${idStr.toLowerCase()} ${name.toLowerCase()} ${backendIcon.toLowerCase()}';
    if (key.contains('first') || key.contains('target')) return Icons.eco_rounded;
    if (key.contains('streak') || key.contains('flame')) return Icons.local_fire_department_rounded;
    if (key.contains('monthly') || key.contains('award')) return Icons.workspace_premium_rounded;
    if (key.contains('goal') || key.contains('trophy')) return Icons.military_tech_rounded;
    if (key.contains('journal') || key.contains('book')) return Icons.auto_stories_rounded;
    if (key.contains('early') || key.contains('sun')) return Icons.wb_sunny_rounded;
    if (key.contains('night') || key.contains('moon')) return Icons.nights_stay_rounded;
    if (key.contains('apprentice') || key.contains('skill') || key.contains('trending')) return Icons.bolt_rounded;
    if (key.contains('perfect') || key.contains('star')) return Icons.hotel_class_rounded;
    return Icons.star_rounded;
  }
}

class _BadgePainter extends CustomPainter {
  final Color color;
  final bool unlocked;
  final String rarity;

  _BadgePainter({
    required this.color,
    required this.unlocked,
    required this.rarity,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * 0.44;

    // 1. Base Octagon / Shield Polygon
    final path = _createOctagonPath(center, radius);

    // 2. Background Fill
    final bgPaint = Paint()
      ..shader = RadialGradient(
        colors: unlocked
            ? [
                color.withAlpha(120),
                const Color(0xFF1E1736),
                const Color(0xFF120C24),
              ]
            : [
                const Color(0xFF221F38),
                const Color(0xFF181528),
                const Color(0xFF0F0D1A),
              ],
        stops: const [0.0, 0.65, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawPath(path, bgPaint);

    // 3. Inner Decorative Rings & Radiance
    if (unlocked) {
      final innerRingPaint = Paint()
        ..color = color.withAlpha(60)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;
      canvas.drawCircle(center, radius * 0.72, innerRingPaint);

      // Star sparkle points around rim
      final starPaint = Paint()
        ..color = Colors.white.withAlpha(180)
        ..style = PaintingStyle.fill;
      for (int i = 0; i < 8; i++) {
        final angle = (i * math.pi / 4) + (math.pi / 8);
        final dotX = center.dx + math.cos(angle) * (radius * 0.86);
        final dotY = center.dy + math.sin(angle) * (radius * 0.86);
        canvas.drawCircle(Offset(dotX, dotY), 1.4, starPaint);
      }
    }

    // 4. Border Stroke with metallic gradient
    final borderPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = unlocked ? 2.5 : 1.5
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: unlocked
            ? [
                Colors.white.withAlpha(220),
                color,
                color.withAlpha(140),
                Colors.white.withAlpha(180),
              ]
            : [
                const Color(0xFF4B5563),
                const Color(0xFF374151),
                const Color(0xFF1F2937),
              ],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawPath(path, borderPaint);
  }

  Path _createOctagonPath(Offset center, double radius) {
    final path = Path();
    const sides = 8;
    for (int i = 0; i < sides; i++) {
      final angle = (i * 2 * math.pi / sides) - (math.pi / sides);
      final x = center.dx + radius * math.cos(angle);
      final y = center.dy + radius * math.sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    return path;
  }

  @override
  bool shouldRepaint(covariant _BadgePainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.unlocked != unlocked ||
        oldDelegate.rarity != rarity;
  }
}
