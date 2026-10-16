import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/journal_model.dart';
import '../../providers/journal_provider.dart';

class JournalEditScreen extends StatefulWidget {
  final JournalModel? journal;

  const JournalEditScreen({super.key, this.journal});

  @override
  State<JournalEditScreen> createState() => _JournalEditScreenState();
}

class _JournalEditScreenState extends State<JournalEditScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _contentController;
  bool _isSaving = false;

  final List<String> _prompts = [
    'What brought me peace today?',
    'A small victory worth remembering',
    'What challenged me and what did I learn?',
    'Something unexpected that made me smile',
  ];

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.journal?.title ?? '');
    _contentController = TextEditingController(text: widget.journal?.content ?? '');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();

    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please give your reflection a title')),
      );
      return;
    }

    setState(() => _isSaving = true);
    final provider = context.read<JournalProvider>();

    if (widget.journal != null) {
      await provider.updateJournal(
        widget.journal!.id,
        title: title,
        content: content,
      );
    } else {
      await provider.createJournal(
        title: title,
        content: content,
      );
    }

    setState(() => _isSaving = false);
    if (mounted) {
      Navigator.pop(context);
    }
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceDark,
        title: const Text('Delete Reflection?', style: TextStyle(color: AppColors.textPrimaryDark)),
        content: const Text('Are you sure you want to remove this journal entry?', style: TextStyle(color: AppColors.textSecondaryDark)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMutedDark)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () async {
              Navigator.pop(ctx);
              if (widget.journal != null) {
                await context.read<JournalProvider>().deleteJournal(widget.journal!.id);
                if (mounted) Navigator.pop(context);
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: Text(widget.journal != null ? 'Edit Reflection' : 'New Reflection'),
        actions: [
          if (widget.journal != null)
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444)),
              onPressed: _isSaving ? null : _confirmDelete,
            ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: TextButton(
              onPressed: _isSaving ? null : _handleSave,
              child: _isSaving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryLight),
                    )
                  : const Text(
                      'Save',
                      style: TextStyle(
                        color: AppColors.primaryLight,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Prompt Suggestion Chips
              const Text(
                'Inspiration Prompts',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMutedDark,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _prompts.map((prompt) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(
                        label: Text(
                          prompt,
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                        ),
                        backgroundColor: AppColors.surfaceLightDark,
                        side: const BorderSide(color: AppColors.borderDark),
                        onPressed: () {
                          if (_titleController.text.isEmpty) {
                            _titleController.text = prompt;
                          } else {
                            _contentController.text += '${_contentController.text.isNotEmpty ? '\n\n' : ''}• $prompt\n';
                          }
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 18),

              // Title Field
              TextField(
                controller: _titleController,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryDark,
                ),
                decoration: const InputDecoration(
                  hintText: 'Title your thoughts...',
                  hintStyle: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textMutedDark,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const Divider(color: AppColors.borderDark, height: 24),

              // Content Multi-line Field
              TextField(
                controller: _contentController,
                maxLines: null,
                minLines: 12,
                style: const TextStyle(
                  fontSize: 15,
                  color: AppColors.textPrimaryDark,
                  height: 1.6,
                ),
                decoration: const InputDecoration(
                  hintText: 'Pour your mind freely. No judgments, just gentle awareness...',
                  hintStyle: TextStyle(
                    fontSize: 15,
                    color: AppColors.textMutedDark,
                    height: 1.6,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
