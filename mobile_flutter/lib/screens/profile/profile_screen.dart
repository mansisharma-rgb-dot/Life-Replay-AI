import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/storage/prefs_service.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/atmospheric_background.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _reduceMotion = false;
  bool _notifyCheckin = true;
  bool _notifyAchievements = true;
  bool _notifyHabits = true;
  bool _aiConsent = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final motion = await PrefsService.isReduceMotion();
    final nCheckin = await PrefsService.isNotifyCheckin();
    final nAch = await PrefsService.isNotifyAchievements();
    final nHabits = await PrefsService.isNotifyHabits();
    final pAnalytics = await PrefsService.isPrivacyAnalyticsEnabled();

    if (mounted) {
      setState(() {
        _reduceMotion = motion;
        _notifyCheckin = nCheckin;
        _notifyAchievements = nAch;
        _notifyHabits = nHabits;
        _aiConsent = pAnalytics;
      });
    }
  }

  void _showEditProfileSheet(BuildContext context, dynamic user, AuthProvider authProvider) {
    final nameController = TextEditingController(text: user?.fullName ?? '');
    final bioController = TextEditingController(text: user?.bio ?? '');
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderDark,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Edit Profile',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimaryDark,
                ),
              ),
              const SizedBox(height: 18),
              const Text('Full Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondaryDark)),
              const SizedBox(height: 6),
              TextField(
                controller: nameController,
                style: const TextStyle(color: AppColors.textPrimaryDark),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceLightDark,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: 14),
              const Text('Bio / Reflection Mantra', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondaryDark)),
              const SizedBox(height: 6),
              TextField(
                controller: bioController,
                maxLines: 2,
                style: const TextStyle(color: AppColors.textPrimaryDark),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceLightDark,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          setModalState(() => isSaving = true);
                          final ok = await authProvider.updateProfile(
                            fullName: nameController.text.trim(),
                            bio: bioController.text.trim(),
                          );
                          if (context.mounted) {
                            Navigator.pop(ctx);
                            if (ok) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Profile updated successfully! ✨')),
                              );
                            }
                          }
                        },
                  child: isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context, AuthProvider authProvider) {
    final currentPwController = TextEditingController();
    final newPwController = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surfaceDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Change Password', style: TextStyle(color: AppColors.textPrimaryDark, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: currentPwController,
                obscureText: true,
                style: const TextStyle(color: AppColors.textPrimaryDark),
                decoration: InputDecoration(
                  labelText: 'Current Password',
                  labelStyle: const TextStyle(color: AppColors.textMutedDark),
                  filled: true,
                  fillColor: AppColors.surfaceLightDark,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: newPwController,
                obscureText: true,
                style: const TextStyle(color: AppColors.textPrimaryDark),
                decoration: InputDecoration(
                  labelText: 'New Password',
                  labelStyle: const TextStyle(color: AppColors.textMutedDark),
                  filled: true,
                  fillColor: AppColors.surfaceLightDark,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textMutedDark)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: isSaving
                  ? null
                  : () async {
                      if (currentPwController.text.isEmpty || newPwController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please fill in both password fields')),
                        );
                        return;
                      }
                      setDialogState(() => isSaving = true);
                      final success = await authProvider.changePassword(
                        currentPwController.text,
                        newPwController.text,
                      );
                      if (context.mounted) {
                        Navigator.pop(ctx);
                        if (success) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Password updated successfully! ✨')),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(authProvider.errorMessage ?? 'Failed to update password')),
                          );
                        }
                      }
                    },
              child: isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Update', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _showHelpBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderDark,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Help & Support Center',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimaryDark),
            ),
            const SizedBox(height: 14),
            _buildFaqItem('How is my Life Score calculated?',
                'Life Score (0-100) measures daily harmony across your mood, habit completion rate, sleep hours, water intake, and focus time.'),
            _buildFaqItem('How does PDF & document extraction work?',
                'Upload your PDFs or TXT notes. Our engine securely extracts text and creates structured AI takeaways to preserve your memories.'),
            _buildFaqItem('What is AI Replay?',
                'AI Replay gathers your last 30 days of reflections, habits, and highlights to weave an empathetic narrative of your personal journey.'),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(question, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryLight)),
          const SizedBox(height: 4),
          Text(answer, style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark, height: 1.4)),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.auto_awesome_rounded, color: AppColors.primaryLight),
            SizedBox(width: 10),
            Text('About Life Replay AI', style: TextStyle(color: AppColors.textPrimaryDark, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Life Replay AI — Personal Growth Analyzer',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.warmCream, fontSize: 14),
            ),
            SizedBox(height: 6),
            Text(
              'A mindful personal companion designed to help you reflect on your thoughts, track daily habits, extract memories from documents, and celebrate your life journey.',
              style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 13, height: 1.4),
            ),
            SizedBox(height: 12),
            Text('Version: 1.0.0 (Build 1)', style: TextStyle(color: AppColors.textMutedDark, fontSize: 12, fontWeight: FontWeight.w600)),
            Text('Platform: Android Native (Flutter)', style: TextStyle(color: AppColors.textMutedDark, fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: AppColors.primaryLight)),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out', style: TextStyle(color: AppColors.textPrimaryDark, fontWeight: FontWeight.bold)),
        content: const Text(
          'Are you sure you want to sign out of your account on this device?',
          style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMutedDark)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await authProvider.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    final String fullName = user?.fullName ?? 'Life Replay Traveler';
    final String email = user?.email ?? 'user@lifereplay.ai';
    final String initials = fullName.isNotEmpty
        ? fullName.trim().split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join('').toUpperCase()
        : 'LR';

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: AtmosphericBackground(
        showStars: !_reduceMotion,
        showNebulaGlow: true,
        child: SafeArea(
          child: RefreshIndicator(
            color: AppColors.primaryLight,
            backgroundColor: AppColors.surfaceDark,
            onRefresh: () async {
              await authProvider.refreshProfile();
            },
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              children: [
                // 1. Clean Profile Header Card
                _buildProfileHeaderCard(fullName, email, initials, user, authProvider),
                const SizedBox(height: 18),

                // 2. Account Section
                _buildSectionLabel('Account'),
                _buildSettingsCard([
                  _buildSettingsRow(
                    icon: Icons.person_outline_rounded,
                    title: 'Name & Bio',
                    subtitle: fullName,
                    onTap: () => _showEditProfileSheet(context, user, authProvider),
                  ),
                  _buildDivider(),
                  _buildSettingsRow(
                    icon: Icons.lock_outline_rounded,
                    title: 'Password Management',
                    subtitle: 'Change your account password',
                    onTap: () => _showChangePasswordDialog(context, authProvider),
                  ),
                  _buildDivider(),
                  _buildSettingsRow(
                    icon: Icons.email_outlined,
                    title: 'Email Address',
                    subtitle: email,
                    trailing: const Icon(Icons.check_circle_rounded, color: AppColors.accentMint, size: 18),
                  ),
                ]),
                const SizedBox(height: 18),

                // 3. Notifications & Reminders Section
                _buildSectionLabel('Notifications & Reminders'),
                _buildSettingsCard([
                  _buildSwitchRow(
                    icon: Icons.alarm_rounded,
                    title: 'Daily Check-in Reminder',
                    subtitle: 'Gentle notification to reflect on your day',
                    value: _notifyCheckin,
                    onChanged: (val) async {
                      setState(() => _notifyCheckin = val);
                      await PrefsService.setNotifyCheckin(val);
                      await authProvider.updateProfile(additionalSettings: {'notifications_checkin': val});
                    },
                  ),
                  _buildDivider(),
                  _buildSwitchRow(
                    icon: Icons.military_tech_outlined,
                    title: 'Milestones & Badges',
                    subtitle: 'Alerts when you unlock new achievements',
                    value: _notifyAchievements,
                    onChanged: (val) async {
                      setState(() => _notifyAchievements = val);
                      await PrefsService.setNotifyAchievements(val);
                    },
                  ),
                  _buildDivider(),
                  _buildSwitchRow(
                    icon: Icons.local_fire_department_outlined,
                    title: 'Habit Streak Alerts',
                    subtitle: 'Remind before streak resets at midnight',
                    value: _notifyHabits,
                    onChanged: (val) async {
                      setState(() => _notifyHabits = val);
                      await PrefsService.setNotifyHabits(val);
                    },
                  ),
                ]),
                const SizedBox(height: 18),

                // 4. Appearance & Theme Section
                _buildSectionLabel('Appearance & Display'),
                _buildSettingsCard([
                  _buildSettingsRow(
                    icon: Icons.dark_mode_outlined,
                    title: 'Theme',
                    subtitle: 'Celestial Twilight (Dark)',
                    trailing: const Text('Active', style: TextStyle(fontSize: 12, color: AppColors.accentMint, fontWeight: FontWeight.bold)),
                  ),
                  _buildDivider(),
                  _buildSwitchRow(
                    icon: Icons.motion_photos_off_outlined,
                    title: 'Reduce Ambient Stars & Motion',
                    subtitle: 'Minimizes background shimmers and animations',
                    value: _reduceMotion,
                    onChanged: (val) async {
                      setState(() => _reduceMotion = val);
                      await PrefsService.setReduceMotion(val);
                    },
                  ),
                ]),
                const SizedBox(height: 18),

                // 5. Privacy & Security Section
                _buildSectionLabel('Privacy & Security'),
                _buildSettingsCard([
                  _buildSwitchRow(
                    icon: Icons.shield_outlined,
                    title: 'AI Insights & Document Analysis',
                    subtitle: 'Allow AI to extract topics and summarize notes',
                    value: _aiConsent,
                    onChanged: (val) async {
                      setState(() => _aiConsent = val);
                      await PrefsService.setPrivacyAnalyticsEnabled(val);
                      await authProvider.updateProfile(additionalSettings: {
                        'privacy_analyze_documents': val,
                        'privacy_analyze_journals': val,
                        'privacy_enable_analytics': val,
                      });
                    },
                  ),
                  _buildDivider(),
                  _buildSettingsRow(
                    icon: Icons.download_rounded,
                    title: 'Export Personal Records',
                    subtitle: 'Download complete account data as JSON',
                    onTap: () async {
                      final data = await authProvider.exportUserData();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(data != null
                                ? 'Export generated with ${data.keys.length} data streams!'
                                : 'Export requested successfully!'),
                          ),
                        );
                      }
                    },
                  ),
                ]),
                const SizedBox(height: 18),

                // 6. Help & About Section
                _buildSectionLabel('Help & Information'),
                _buildSettingsCard([
                  _buildSettingsRow(
                    icon: Icons.help_outline_rounded,
                    title: 'Help Center & FAQs',
                    subtitle: 'How scores, journals, and extraction work',
                    onTap: () => _showHelpBottomSheet(context),
                  ),
                  _buildDivider(),
                  _buildSettingsRow(
                    icon: Icons.info_outline_rounded,
                    title: 'About Life Replay AI',
                    subtitle: 'Version 1.0.0 (Build 1)',
                    onTap: () => _showAboutDialog(context),
                  ),
                ]),
                const SizedBox(height: 22),

                // 7. Logout Button
                _buildLogoutButton(context, authProvider),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── PROFILE HEADER ─────────────────────────────────────────────────────────
  Widget _buildProfileHeaderCard(
    String fullName,
    String email,
    String initials,
    dynamic user,
    AuthProvider authProvider,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceCardDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderDark),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.primary,
            child: Text(
              initials,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fullName,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimaryDark,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryDark,
                  ),
                ),
              ],
            ),
          ),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primaryLight,
              side: const BorderSide(color: AppColors.primaryLight),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            onPressed: () => _showEditProfileSheet(context, user, authProvider),
            child: const Text('Edit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // ─── SETTINGS CARD & ROWS ───────────────────────────────────────────────────
  Widget _buildSectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppColors.textMutedDark,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildSettingsCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceCardDark,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderDark),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildDivider() {
    return const Divider(
      height: 1,
      thickness: 0.6,
      color: AppColors.borderDark,
      indent: 52,
    );
  }

  Widget _buildSettingsRow({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceLightDark,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.primaryLight, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimaryDark),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
      ),
      trailing: trailing ?? const Icon(Icons.chevron_right_rounded, color: AppColors.textMutedDark, size: 20),
      onTap: onTap,
    );
  }

  Widget _buildSwitchRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      secondary: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceLightDark,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.primaryLight, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimaryDark),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
      ),
      value: value,
      activeThumbColor: AppColors.primaryLight,
      activeTrackColor: AppColors.primary.withAlpha(128),
      inactiveTrackColor: AppColors.surfaceLightDark,
      onChanged: onChanged,
    );
  }

  // ─── LOGOUT BUTTON ──────────────────────────────────────────────────────────
  Widget _buildLogoutButton(BuildContext context, AuthProvider authProvider) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFEF4444),
          side: const BorderSide(color: Color(0xFFEF4444), width: 1.2),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        onPressed: () => _confirmLogout(context, authProvider),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.logout_rounded, size: 18),
            SizedBox(width: 8),
            Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}
