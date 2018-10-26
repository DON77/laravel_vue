<?php

namespace App\Http\Controllers;

use App\Models\CtaElement;
use App\Models\EmailApi;
use App\Models\Video;
use Aws\Amazon\Amazon;
use Cartalyst\Sentry\Facades\Laravel\Sentry;
use Illuminate\Http\Request;
use Madcoda\Youtube;
use ShopifyApi\Shopify\Shopify;

class CtaElementController extends Controller
{
    /**
     * Show the form for creating a new resource.
     *
     * @param \Illuminate\Http\Request $request
     * @return Response
     */
    public function create(Request $request)
    {
        $type = $request->input('type');
        $videoId = $request->input('videoId');
        $start_time = ceil($request->input('start_time', 0));

        $video = Video::find($videoId);

        $video->duration_formatted = format_duration($video->duration);
        if ($start_time + 10 > $video->duration) {
            $start_time = $video->duration - 10;
        }

        $ctaElement = new CtaElement();
        $defaultValues = $ctaElement->cta_default_values($type);
        $ctaElement->video_id = $videoId;
        $ctaElement->cta_element_type = $type;
        $ctaElement->cta_element_value = $defaultValues;
        $ctaElement->start_time = $start_time;
        $ctaElement->end_time = $start_time + 10;
        $ctaElement->save();
        $ctaElement = $ctaElement::formatCtaElement($ctaElement);
        $ctaElement->cta_element_value = $defaultValues;

        return $ctaElement;

        $defaultValues->start_formatted = format_duration($ctaElement->start_time);
        $defaultValues->end_formatted = format_duration($ctaElement->end_time);

        $connectedToProviders = EmailApi::providersAvailable();
        return view('project.video.elements.' . $type, [
            'element' => $ctaElement,
            'data' => $defaultValues,
            'connectedToProviders' => $connectedToProviders,
            'video' => $video
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param \Illuminate\Http\Request $request
     * @internal param int $id
     * @return Response
     */
    public function destroy(Request $request)
    {
        $id = $request->input('id');
        $ctaElement = CtaElement::find($id);
        $userId = Sentry::getUser()->id;

        $ctaElement->delete();
    }

    /**
     * Returns youtubeAccount as array
     *
     * @param Request $request
     * @return array
     * @throws \Exception
     */
    public function youtubeAccount(Request $request)
    {
        $yt = new Youtube([
            'key' => env('YOUTUBE_API_KEY')
        ]);
        return (array)$yt->getChannelFromURL($request->input('url'));
    }

    /**
     * Returns amazon listing as array
     *
     * @param Request $request
     * @return array
     */
    public function amazonListing(Request $request)
    {
        $amazon = new Amazon($request->input('url'));
        return $amazon->getData();
    }

    public function shopifyListing(Request $request)
    {
        $shopify = new Shopify($request->input('url'));
        return $shopify->getData();
    }

}
