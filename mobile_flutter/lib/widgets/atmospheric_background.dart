import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

/// A premium, atmospheric celestial backdrop with soft glowing nebulae
/// and twinkling starlight particles.
class AtmosphericBackground extends StatefulWidget {
  final Widget? child;
  final bool showStars;
  final bool showNebulaGlow;
  final Color? baseColor;

  const AtmosphericBackground({
    super.key,
    this.child,
    this.showStars = true,
    this.showNebulaGlow = true,
    this.baseColor,
  });

  @override
  State<AtmosphericBackground> createState() => _AtmosphericBackgroundState();
}

class _AtmosphericBackgroundState extends State<AtmosphericBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final baseBg = widget.baseColor ?? AppColors.backgroundDark;

    return Stack(
      fit: StackFit.expand,
      children: [
        // 1. Deep Midnight Gradient Base
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                baseBg,
                AppColors.deepTwilight,
                baseBg,
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),

        // 2. Layered Ambient Nebulae (Top-Left Lavender, Bottom-Right Rose/Cyan)
        if (widget.showNebulaGlow)
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, _) {
              final pulse = _pulseController.value;
              return Stack(
                fit: StackFit.expand,
                children: [
                  // Upper Lavender Orb
                  Positioned(
                    top: -60,
                    left: -40,
                    child: Container(
                      width: 260 + (pulse * 20),
                      height: 260 + (pulse * 20),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppColors.primaryLight.withAlpha((40 + pulse * 15).toInt()),
                            AppColors.primary.withAlpha((20 + pulse * 10).toInt()),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Center-Right Rose/Periwinkle Orb
                  Positioned(
                    top: 240,
                    right: -60,
                    child: Container(
                      width: 280,
                      height: 280,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppColors.secondary.withAlpha((28 + pulse * 12).toInt()),
                            AppColors.periwinkle.withAlpha((15 + pulse * 8).toInt()),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Bottom Cyan/Mint Ground Glow
                  Positioned(
                    bottom: -50,
                    left: 20,
                    child: Container(
                      width: 240,
                      height: 240,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppColors.accent.withAlpha(20),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

        // 3. Subtle Constellation / Starfield Canvas
        if (widget.showStars)
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, _) {
              return CustomPaint(
                painter: _StarfieldPainter(shimmerValue: _pulseController.value),
                size: Size.infinite,
              );
            },
          ),

        // 4. Foreground Content
        if (widget.child != null) widget.child!,
      ],
    );
  }
}

class _StarfieldPainter extends CustomPainter {
  final double shimmerValue;
  static final List<math.Point<double>> _cachedStars = [];

  _StarfieldPainter({required this.shimmerValue}) {
    if (_cachedStars.isEmpty) {
      final rand = math.Random(42); // Deterministic seed for stable constellation layout
      for (int i = 0; i < 48; i++) {
        _cachedStars.add(math.Point(rand.nextDouble(), rand.nextDouble()));
      }
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    for (int i = 0; i < _cachedStars.length; i++) {
      final star = _cachedStars[i];
      final x = star.x * size.width;
      final y = star.y * size.height;

      // Group stars into small twinkle variations
      final phase = (shimmerValue + (i / _cachedStars.length)) % 1.0;
      final alphaVal = ((0.2 + 0.55 * math.sin(phase * math.pi)).clamp(0.08, 0.85) * 255).toInt();

      paint.color = (i % 3 == 0)
          ? AppColors.periwinkle.withAlpha(alphaVal)
          : (i % 5 == 0)
              ? AppColors.secondaryLight.withAlpha((alphaVal * 0.8).toInt())
              : AppColors.warmCream.withAlpha((alphaVal * 0.9).toInt());

      final radius = (i % 7 == 0) ? 1.8 : ((i % 4 == 0) ? 1.3 : 0.9);
      canvas.drawCircle(Offset(x, y), radius, paint);

      // Add delicate 4-point sparkle to select prominent stars
      if (i % 11 == 0 && alphaVal > 115) {
        final sparkPaint = Paint()
          ..color = AppColors.warmCream.withAlpha((alphaVal * 0.4).toInt())
          ..strokeWidth = 0.8
          ..style = PaintingStyle.stroke;
        canvas.drawLine(Offset(x - 3, y), Offset(x + 3, y), sparkPaint);
        canvas.drawLine(Offset(x, y - 3), Offset(x, y + 3), sparkPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _StarfieldPainter oldDelegate) =>
      oldDelegate.shimmerValue != shimmerValue;
}
