import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Save } from 'lucide-react-native';
import { ProviderConfig, ProviderType } from '../core/types/chat';
import { DEFAULT_PROVIDERS, PROVIDER_LABELS } from '../core/constants';

const formSchema = z
  .object({
    id: z.string(),
    providerName: z.enum(['openai', 'gemini', 'openrouter', 'lmstudio', 'custom']),
    baseUrl: z.string().min(1, 'Base URL is required'),
    apiKey: z.string().optional().or(z.literal('')),
    model: z.string().min(1, 'Model name is required'),
  })
  .refine(
    (data) => {
      const isCloud =
        ['openai', 'gemini', 'openrouter'].includes(data.providerName) ||
        data.baseUrl.includes('openai.com') ||
        data.baseUrl.includes('openrouter.ai') ||
        data.baseUrl.includes('googleapis.com');
      if (isCloud) {
        return !!data.apiKey && data.apiKey.trim().length > 0;
      }
      return true;
    },
    {
      message: 'API Key is required for cloud providers',
      path: ['apiKey'],
    }
  );

type FormData = z.infer<typeof formSchema>;

interface ProviderConfigFormProps {
  provider: ProviderConfig;
  onSave: (config: ProviderConfig) => Promise<void>;
  isDark: boolean;
}

export const ProviderConfigForm: React.FC<ProviderConfigFormProps> = ({
  provider,
  onSave,
  isDark,
}) => {
  const [secureText, setSecureText] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: provider.id,
      providerName: provider.providerName,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      model: provider.model,
    },
  });

  // Keep form updated if selected provider changes
  useEffect(() => {
    reset({
      id: provider.id,
      providerName: provider.providerName,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      model: provider.model,
    });
  }, [provider]);

  const providerNameValue = watch('providerName');

  const handleResetDefaults = () => {
    const defaults = DEFAULT_PROVIDERS[providerNameValue];
    setValue('baseUrl', defaults.baseUrl);
    setValue('model', defaults.model);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setSuccess(false);
    try {
      await onSave({
        id: data.id,
        providerName: data.providerName,
        baseUrl: data.baseUrl.trim(),
        apiKey: data.apiKey ? data.apiKey.trim() : '',
        model: data.model.trim(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const labelColor = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-brand-input border-brand-border text-white' : 'bg-white border-slate-200 text-slate-800';

  return (
    <View className="space-y-5 gap-4">
      <View className="flex-row items-center justify-between">
        <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Configure {PROVIDER_LABELS[provider.providerName]}
        </Text>
        <TouchableOpacity onPress={handleResetDefaults} className="p-1">
          <Text className="text-xs text-brand-accent font-semibold" style={{ color: '#6366F1' }}>
            Reset Defaults
          </Text>
        </TouchableOpacity>
      </View>

      {/* Base URL Field */}
      <View className="space-y-1 gap-1">
        <Text className={`text-xs font-semibold uppercase ${labelColor}`}>Base URL</Text>
        <Controller
          control={control}
          name="baseUrl"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={`px-4 py-3 rounded-2xl border ${inputBg}`}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="https://api.openai.com/v1"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {watch('baseUrl')?.includes('localhost') && Platform.OS !== 'web' && (
          <Text className="text-amber-500 text-[10px] mt-1 font-semibold leading-relaxed">
            {"⚠️ 'localhost' might not resolve on mobile. Use your host's local IP (e.g. 192.168.x.x) or 10.0.2.2 for Android emulators."}
          </Text>
        )}
        {errors.baseUrl && (
          <Text className="text-red-500 text-xs mt-1">{errors.baseUrl.message}</Text>
        )}
      </View>

      {/* Model ID Field */}
      <View className="space-y-1 gap-1">
        <Text className={`text-xs font-semibold uppercase ${labelColor}`}>Model ID / Name</Text>
        <Controller
          control={control}
          name="model"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={`px-4 py-3 rounded-2xl border ${inputBg}`}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="gpt-4o-mini"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {errors.model && (
          <Text className="text-red-500 text-xs mt-1">{errors.model.message}</Text>
        )}
      </View>

      {/* API Key Field */}
      {providerNameValue !== 'lmstudio' && (
        <View className="space-y-1 gap-1">
          <Text className={`text-xs font-semibold uppercase ${labelColor}`}>API Key</Text>
          <View className={`flex-row items-center border rounded-2xl px-1 ${inputBg}`}>
            <Controller
              control={control}
              name="apiKey"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`flex-1 px-3 py-3 ${isDark ? 'text-white' : 'text-slate-800'}`}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={
                    providerNameValue === 'custom' ? 'API Key (Optional)' : 'Enter API Key'
                  }
                  placeholderTextColor="#64748B"
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} className="p-3">
              {secureText ? (
                <Eye size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              ) : (
                <EyeOff size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              )}
            </TouchableOpacity>
          </View>
          {errors.apiKey && (
            <Text className="text-red-500 text-xs mt-1">{errors.apiKey.message}</Text>
          )}
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        disabled={saving}
        className="flex-row items-center justify-center py-4 rounded-2xl mt-4"
        style={{ backgroundColor: saving ? 'rgba(99, 102, 241, 0.5)' : '#6366F1' }}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Save size={18} color="#ffffff" className="mr-2" />
            <Text className="text-white font-bold text-sm ml-2">
              {success ? 'Configuration Saved! ✓' : 'Save Configuration'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
